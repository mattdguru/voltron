Voltron.setup do |config|

  # === Voltron Base Configuration ===

  # Whether to enable debug output in the browser console and terminal window
  # config.debug = false

  # The base url of the site. Used by various voltron-* gems to correctly build urls
  # config.base_url = "http://localhost:3000"

  # What logger calls to Voltron.log should use
  # config.logger = Logger.new(Rails.root.join("log", "voltron.log"))

  # Whether to allow the flash! method to pass messages through http headers on ajax responses
  # config.flash.enabled = true

  # What http header the flash messages should be added to on ajax responses
  # config.flash.header = "X-Flash"

end