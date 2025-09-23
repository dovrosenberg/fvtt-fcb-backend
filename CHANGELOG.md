# Change Log

## v1.4 - Better file naming

- Image file names now include the name of the entry (if provided) rather than just a generic 'character-image' or 'location-image'

## v1.0.2 - Fixed issue with creating GCS bucket even when using aws

- Fixed issue where not providing a GCS bucket name would crash the deploy script even if STORAGE_TYPE was set to aws

## v1.0.1 - Fixed crash when not using gmail

- Fixed issue where server would crash on load if not provided gmail credentials (even if INCLUDE_EMAIL_SETUP flag was set to false)


## v1.0.0 - Coming out of beta!

Initial release.
