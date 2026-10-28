import Foundation
import Capacitor
import StoreKit

/// In-App-Kauf der Waagemodell-Vollversion über StoreKit 2.
/// Übernommen aus FairSeat (Cordova) und auf Capacitor umgestellt.
/// Ein einziges, nicht verbrauchbares Produkt. Die App erfährt nur „gekauft ja/nein“;
/// geprüft wird die von Apple signierte Transaktion, nichts geht an eigene Server.
///
/// Hinweis: Capacitor liest den Klassennamen aus dem ersten @objc(…) dieser Datei.
@objc(WaageStorePlugin)
public class WaageStorePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WaageStorePlugin"
    public let jsName = "WaageStore"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "product", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "buy", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise)
    ]

    private var updatesTask: Task<Void, Never>?

    // Beim Start lauschen: Käufe, die erst später bestätigt werden („Kaufen anfragen“
    // in der Familienfreigabe), Käufe von anderen Geräten und Erstattungen kommen hier an.
    override public func load() {
        guard #available(iOS 15.0, *) else { return }
        updatesTask = Task.detached { [weak self] in
            for await update in StoreKit.Transaction.updates {
                guard case .verified(let tx) = update else { continue }
                await tx.finish()
                let id = tx.productID
                DispatchQueue.main.async { self?.notifyListeners("change", data: ["productId": id]) }
            }
        }
    }

    deinit {
        updatesTask?.cancel()
    }

    // ---- Befehle ----

    @objc func status(_ call: CAPPluginCall) {
        guard #available(iOS 15.0, *) else { call.resolve(["available": false, "owned": false]); return }
        guard let id = productId(call) else { return }
        Task {
            let owned = await self.owns(id)
            call.resolve(["available": true, "owned": owned])
        }
    }

    @objc func product(_ call: CAPPluginCall) {
        guard #available(iOS 15.0, *) else { call.reject("StoreKit 2 erst ab iOS 15"); return }
        guard let id = productId(call) else { return }
        Task {
            do {
                guard let p = try await Product.products(for: [id]).first else {
                    call.reject("product not found"); return
                }
                call.resolve(["id": p.id, "price": p.displayPrice])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func buy(_ call: CAPPluginCall) {
        guard #available(iOS 15.0, *) else { call.reject("StoreKit 2 erst ab iOS 15"); return }
        guard let id = productId(call) else { return }
        Task {
            do {
                guard let p = try await Product.products(for: [id]).first else {
                    call.reject("product not found"); return
                }
                let result = try await p.purchase()
                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let tx):
                        await tx.finish()
                        call.resolve(["result": "purchased"])
                    case .unverified(_, let err):
                        // Signatur stimmt nicht – nicht freischalten
                        call.reject("unverified: " + err.localizedDescription)
                    }
                case .pending:
                    call.resolve(["result": "pending"])
                case .userCancelled:
                    call.resolve(["result": "cancelled"])
                @unknown default:
                    call.resolve(["result": "cancelled"])
                }
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        guard #available(iOS 15.0, *) else { call.resolve(["owned": false, "error": "", "cancelled": false]); return }
        guard let id = productId(call) else { return }
        Task {
            var problem = ""
            var cancelled = false
            do {
                try await AppStore.sync()          // fragt ggf. nach der Apple-ID
            } catch StoreKitError.userCancelled {
                cancelled = true                   // Anmeldung abgebrochen – der Stand zählt trotzdem
            } catch {
                problem = error.localizedDescription
            }
            let owned = await self.owns(id)
            call.resolve(["owned": owned, "error": problem, "cancelled": cancelled])
        }
    }

    // ---- Helfer ----

    private func productId(_ call: CAPPluginCall) -> String? {
        guard let id = call.getString("id"), !id.isEmpty, id.count <= 100 else {
            call.reject("no product id")
            return nil
        }
        return id
    }

    /// Gilt der Kauf? Nur von Apple bestätigte, nicht erstattete Transaktionen zählen.
    @available(iOS 15.0, *)
    private func owns(_ id: String) async -> Bool {
        for await entitlement in StoreKit.Transaction.currentEntitlements {
            if case .verified(let tx) = entitlement, tx.productID == id, tx.revocationDate == nil {
                return true
            }
        }
        return false
    }
}
