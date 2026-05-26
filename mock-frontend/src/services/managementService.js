import { getMyProfile } from './profileService'

/** @deprecated Use getMyProfile from profileService */
export function getProfile() {
  return getMyProfile()
}
