# Passt das von Capacitor erzeugte Xcode-Projekt für den App Store an.
#
# Bewusst über das xcodeproj-Gem statt über Kommandozeilen-Schalter bei
# xcodebuild: Ein PROVISIONING_PROFILE_SPECIFIER auf der Kommandozeile gilt
# für alle Ziele, auch für die Pods – die lassen sich nicht mit einem Profil
# signieren und der Archivlauf bricht ab. Hier wird nur das Ziel "App" gesetzt.
#
# Aufruf (Umgebungsvariablen):
#   PROJEKT       Pfad zu App.xcodeproj
#   VERSION       Marketing-Version, z. B. 1.0.0
#   BUILD         Build-Nummer, z. B. 42
#   PRIVACY       Pfad zum PrivacyInfo.xcprivacy, das ins Ziel aufgenommen wird
#   TEAM_ID, IDENTITAET, PROFIL_NAME   nur für den signierten Release-Build
require "xcodeproj"

projekt = Xcodeproj::Project.open(ENV.fetch("PROJEKT"))
ziel = projekt.targets.find { |t| t.name == "App" } or abort "Ziel 'App' nicht gefunden"

# Mindestversion iOS 15 (Apple verlangt sie ab April 2027, StoreKit 2 braucht sie).
MIN_IOS = "15.0"
projekt.build_configurations.each { |k| k.build_settings["IPHONEOS_DEPLOYMENT_TARGET"] = MIN_IOS }

ziel.build_configurations.each do |konf|
  s = konf.build_settings
  s["IPHONEOS_DEPLOYMENT_TARGET"] = MIN_IOS
  s["MARKETING_VERSION"] = ENV.fetch("VERSION")
  s["CURRENT_PROJECT_VERSION"] = ENV.fetch("BUILD")
  next unless konf.name == "Release" && ENV["TEAM_ID"].to_s != ""
  s["CODE_SIGN_STYLE"] = "Manual"
  s["DEVELOPMENT_TEAM"] = ENV.fetch("TEAM_ID")
  s["CODE_SIGN_IDENTITY"] = ENV.fetch("IDENTITAET")
  s["CODE_SIGN_IDENTITY[sdk=iphoneos*]"] = ENV.fetch("IDENTITAET")
  s["PROVISIONING_PROFILE_SPECIFIER"] = ENV.fetch("PROFIL_NAME")
  puts "Release signiert mit Team #{s['DEVELOPMENT_TEAM']}, Profil '#{s['PROVISIONING_PROFILE_SPECIFIER']}'"
end

# Datenschutz-Manifest als Ressource aufnehmen (genau einmal).
privacy = ENV["PRIVACY"].to_s
if privacy != ""
  gruppe = projekt.main_group.find_subpath("App", false) or abort "Gruppe 'App' nicht gefunden"
  name = File.basename(privacy)
  if gruppe.files.none? { |f| f.path == name }
    ref = gruppe.new_reference(name)
    ziel.resources_build_phase.add_file_reference(ref, true)
    puts "#{name} ins Ziel aufgenommen"
  else
    puts "#{name} ist bereits im Ziel"
  end
end

projekt.save
