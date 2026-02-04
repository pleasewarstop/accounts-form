<template>
  <div class="wrapper">
    <div class="header">
      <h2>Учётные записи</h2>
      <el-button class="add" square type="default" @click="add" :disabled="hasError">+</el-button>
    </div>

    <el-alert type="info" show-icon :closable="false" class="hint">
      Для указания нескольких меток для одной пары логин/пароль используйте разделитель ;
    </el-alert>

    <div class="grid">
      <div class="head-cell">Метки</div>
      <div class="head-cell">Тип записи</div>
      <div class="head-cell">Логин</div>
      <div class="head-cell">Пароль</div>
      <div class="head-cell"></div>

      <AccountsFormRow
        v-for="d in drafts"
        :key="d.id"
        :draft="d"
        :errors="errors[d.id]"
        @patch="patch(d, $event)"
        @save="save(d)"
        @remove="remove(d)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, computed } from 'vue'
import { nanoid } from 'nanoid'
import { useAccountsStore } from '@/stores/accounts'
import AccountsFormRow from './AccountsFormRow.vue'
import type { AccountDraft, AccountErrors } from './AccountsFormRow.vue'
import type { Account } from '../types/account'

const store = useAccountsStore()

const drafts = reactive<AccountDraft[]>([])
const errors = reactive<Record<string, AccountErrors>>({})
const hasError = computed(() => drafts.some((d) => Object.keys(getErrors(d)).length))

onMounted(() => {
  store.init()

  store.accounts.forEach((a) => {
    drafts.push({
      id: nanoid(),
      type: a.type,
      login: a.login,
      password: a.password,
      labels: a.labels.map((l) => l.text).join(';'),
    })
  })
  if (!drafts.length) add()
})

function add() {
  drafts.push({
    id: nanoid(),
    type: 'LOCAL',
    login: '',
    password: null,
    labels: '',
  })
}

function patch(d: AccountDraft, diff: Partial<AccountDraft>) {
  Object.assign(d, diff)
}

function remove(d: AccountDraft) {
  const i = drafts.indexOf(d)
  drafts.splice(i, 1)
  store.remove(i)
  delete errors[d.id]
  if (!drafts.length) add()
}

function save(d: AccountDraft) {
  if (!validate(d)) return

  store.set(drafts.indexOf(d), {
    type: d.type,
    login: d.login,
    password: d.type === 'LDAP' ? null : d.password,
    labels: labelsToArray(d.labels),
  })
}

function validate(d: AccountDraft) {
  const e = getErrors(d)

  if (Object.keys(e).length) {
    errors[d.id] = e
  } else {
    delete errors[d.id]
  }
  return !errors[d.id]
}

function getErrors(d: AccountDraft) {
  const e: AccountErrors = {}
  if (!d.login) e.login = true
  if (d.type === 'LOCAL' && !d.password) e.password = true
  return e
}

function labelsToArray(labels: string) {
  const obj: Record<string, Account['labels'][number]> = {}
  const splitted = labels
    .split(';')
    .map((l) => l.trim())
    .filter(Boolean)

  for (const text of splitted) obj[text] = { text }
  return Object.values(obj)
}
</script>

<style scoped>
.wrapper {
  max-width: 1100px;
  margin: 40px auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.hint {
  margin-bottom: 16px;
}

.grid {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr 2fr auto;
  gap: 12px;
  margin-bottom: 12px;
}

.head-cell {
  font-weight: bold;
}
</style>
