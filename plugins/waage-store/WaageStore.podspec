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
  # Wie die App (der Workflow stellt sie auf iOS 15 um); StoreKit 2 braucht 15.
  s.ios.deployment_target = '15.0'
  s.dependency 'Capacitor'
  s.frameworks       = 'StoreKit'
  s.swift_version    = '5.1'
end
