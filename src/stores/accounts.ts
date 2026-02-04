import { defineStore } from 'pinia'
import type { Account } from '@/types/account'

const KEY = 'accounts'

export const useAccountsStore = defineStore(KEY, {
  state: () => ({
    accounts: [] as Account[],
  }),
  actions: {
    init() {
      const raw = localStorage.getItem(KEY)
      if (raw) this.accounts = JSON.parse(raw)
    },
    set(i: number, account: Account) {
      this.accounts[i] = account
      this.save()
    },
    remove(i: number) {
      this.accounts.splice(i, 1)
      this.save()
    },
    save() {
      localStorage.setItem(KEY, JSON.stringify(this.accounts))
    },
  },
})
