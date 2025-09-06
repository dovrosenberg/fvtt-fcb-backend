# Change Log

## 1.3.0 - 

- Better RPG descriptions

## 1.2.1 - Gmail grant fix

- Fixed install instructions to prevent gmail tokens from timing out

## 1.2.0 - AI improvements

- Improvements to description generation and using proper species descriptions.  Better role-playing descriptions, including voice suggestions.

## 1.1.0 - Ability to change AI models

- Added ability to change AI models for description generation and image generation

## v1.0.2 - Fixed issue with creating GCS bucket even when using aws

- Fixed issue where not providing a GCS bucket name would crash the deploy script even if STORAGE_TYPE was set to aws

## v1.0.1 - Fixed crash when not using gmail

- Fixed issue where server would crash on load if not provided gmail credentials (even if INCLUDE_EMAIL_SETUP flag was set to false)


## v1.0.0 - Coming out of beta!

Initial release.
