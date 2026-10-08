export interface ModeratorCandidate {
  email?: string
  email_verified?: boolean
}

/**
 * Compile the moderators regex from runtime config.
 * Blank values are treated as unset. Invalid patterns throw a `SyntaxError`.
 * The value is coerced to a string since env overrides go through `destr` and can come back as numbers.
 */
export function parseModeratorsRegex(pattern: unknown): RegExp | undefined {
  if (pattern === undefined || pattern === null) {
    return undefined
  }

  const source = String(pattern).trim()
  if (!source) {
    return undefined
  }

  // No `g` flag: it would make `test()` stateful through `lastIndex`
  return new RegExp(source, 'i')
}

/**
 * A user is a moderator if their email is in the list, or if it matches the regex.
 * The regex only applies to verified emails since it can authorize addresses nobody listed explicitly.
 */
export function isGoogleModerator(user: ModeratorCandidate, moderators: string[], regex?: RegExp): boolean {
  const email = typeof user.email === 'string' ? user.email : ''
  if (!email) {
    return false
  }

  if (moderators.includes(email)) {
    return true
  }

  return Boolean(regex && user.email_verified === true && regex.test(email))
}
