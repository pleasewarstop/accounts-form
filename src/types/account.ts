export type AccountType = 'LDAP' | 'LOCAL'

export interface Label {
  text: string
}

export interface Account {
  labels: Label[]
  type: AccountType
  login: string
  password: string | null
}
