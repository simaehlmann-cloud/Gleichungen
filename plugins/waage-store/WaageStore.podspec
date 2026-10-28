# Der Pod-Name muss zum Paketnamen passen: Capacitor macht aus "waage-store"
# den Namen "WaageStore" und schreibt ihn so ins Podfile.
Pod::Spec.new do |s|
  s.name             = 'WaageStore'
  s.version          = '1.0.0'
  s.summary          = 'In-App-Kauf der Waagemodell-Vollversion (StoreKit 2)'
  s.license          = 'MIT'
  s.homepage         = 'https://github.com/simaehlmann-cloud/Gleichungen'
  s.author           = 'Simon Mählmann'
  s.source           = { :git => 'https://github.com/simaehlmann-cloud/Gleichungen.git', :tag => s.version.to_s }
  s.source_files     = 'ios/Plugin/**/*.{swift,h,m}'
  # Bewusst 14.0, obwohl die App auf 15 läuft: "cap add ios" führt pod install
  # schon mit dem Podfile des Templates (iOS 14) aus, bevor der Workflow es auf
  # 15 umstellen kann. Mit 15.0 hier bricht genau dieser erste Lauf ab.
  # Der Swift-Code prüft iOS 15 zur Laufzeit (#available), übersetzt also auch so.
  s.ios.deployment_target = '14.0'
  s.dependency 'Capacitor'
  s.frameworks       = 'StoreKit'
  s.swift_version    = '5.1'
end
