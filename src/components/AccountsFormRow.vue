<template>
  <div class="relative">
    <div
      v-if="hasChanges"
      class="unsaved"
      :class="{ interacted: canInteractUnsaved }"
      title="Не сохранено"
      @click="onClickUnsaved"
    />
    <el-input
      type="textarea"
      :model-value="draft.labels"
      class="textarea"
      :maxlength="50"
      ref="labelsRef"
      autosize
      @update:model-value="emit('patch', { labels: $event })"
      @blur="emit('save')"
    />
  </div>

  <el-select
    placeholder="Тип"
    :model-value="draft.type"
    @update:model-value="emit('patch', { type: $event })"
  >
    <el-option label="LDAP" value="LDAP" />
    <el-option label="Локальная" value="LOCAL" />
  </el-select>

  <el-input
    :model-value="draft.login"
    :maxlength="100"
    class="input"
    :class="{
      invalid: isInvalid('login'),
      'ldap-login': draft.type === 'LDAP',
    }"
    ref="loginRef"
    @update:model-value="emit('patch', { login: $event })"
    @focus="onFocusWithValidation('login')"
    @blur="onBlurWithValidation('login')"
  />

  <el-input
    v-if="draft.type === 'LOCAL'"
    :model-value="draft.password"
    :type="showPassword ? 'text' : 'password'"
    :maxlength="100"
    class="input"
    :class="{
      invalid: isInvalid('password'),
    }"
    ref="passwordRef"
    @update:model-value="emit('patch', { password: $event })"
    @focus="onFocusWithValidation('password')"
    @blur="onBlurWithValidation('password')"
  >
    <template #suffix>
      <el-icon @click="showPassword = !showPassword" class="icon">
        <component :is="showPassword ? View : Hide" />
      </el-icon>
    </template>
  </el-input>

  <el-button type="default" class="remove" :icon="Delete" circle @click="$emit('remove')" />
</template>

<script setup lang="ts">
import { Delete } from '@element-plus/icons-vue'
import type { Account } from '@/types/account'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useResizeObserver } from '../hooks/useResizeObserver'
import { View, Hide } from '@element-plus/icons-vue'
import { labelsToArray } from '../util/account'

export type AccountDraft = Omit<Account, 'labels'> & {
  id: string
  labels: string
}

export type AccountErrors = Partial<Record<keyof AccountDraft, boolean>>

const props = defineProps<{
  draft: AccountDraft
  account: Account | undefined
  errors: AccountErrors
}>()

const emit = defineEmits<{
  (e: 'patch', diff: Partial<AccountDraft>): void
  (e: 'remove'): void
  (e: 'save'): void
}>()

const showPassword = ref(false)

const hasChanges = computed(() => {
  const { account, draft } = props
  if (!account) return true

  for (const keySt in account) {
    const key = keySt as keyof Account

    if (key === 'labels') {
      const labels = labelsToArray(draft[key])
      if (labels.length !== account.labels.length) return true

      for (let i = 0; i < labels.length; i++) {
        if (labels[i]?.text !== account.labels[i]?.text) return true
      }
    } else if (key === 'password') {
      if (draft.type === 'LOCAL' && draft[key] !== account[key]) {
        return true
      }
    } else if (draft[key] !== account[key]) return true
  }
  return false
})

const canInteractUnsaved = computed(() => {
  return fieldsWithValidation.some(
    (field) => props.errors[field] && !canInvalid.value[field] && !isFocused.value[field],
  )
})

type InputRefValue = InstanceType<(typeof import('element-plus'))['ElInput']> | null
const labelsRef = ref<InputRefValue>(null)
const loginRef = ref<InputRefValue>(null)
const passwordRef = ref<InputRefValue>(null)

const fieldsWithValidation = ['login', 'password'] as const
type FieldWithValidation = (typeof fieldsWithValidation)[number]

const canInvalid = ref<Record<FieldWithValidation, boolean>>({
  login: !props.errors.login,
  password: !props.errors.password,
})
const fieldsWithValidationRefs = {
  login: loginRef,
  password: passwordRef,
}
const isFocused = ref<Record<FieldWithValidation, boolean>>({
  login: false,
  password: false,
})

onMounted(() => {
  if (!props.draft.login) nextTickFocus(loginRef)
})

watch(
  () => props.draft.type,
  () => emit('save'),
)

watch(
  () => props.draft.type,
  (type) => {
    if (type === 'LOCAL') {
      canInvalid.value.password = !!props.draft.password
    }
    if (props.errors.login) {
      nextTickFocus(loginRef)
    } else if (type === 'LOCAL' && props.errors.password) {
      nextTickFocus(passwordRef)
    }
  },
)

useResizeObserver(labelsRef, () => labelsRef.value?.resizeTextarea?.())

function onClickUnsaved() {
  const field = fieldsWithValidation.find((x) => props.errors[x])
  if (!field || !canInteractUnsaved.value) return

  const ref = fieldsWithValidationRefs[field]
  ref.value?.focus()
}

function onFocusWithValidation(field: FieldWithValidation) {
  isFocused.value[field] = true
}

function onBlurWithValidation(field: FieldWithValidation) {
  canInvalid.value[field] = true
  isFocused.value[field] = false
  emit('save')
}

function isInvalid(field: FieldWithValidation) {
  return canInvalid.value[field] && props.errors[field]
}

async function nextTickFocus(ref: { value: InputRefValue }) {
  await nextTick()
  ref.value?.focus()
}
</script>

<style scoped>
.relative {
  position: relative;
}

.unsaved {
  position: absolute;
  left: -14px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  opacity: 0.6;
  background-color: #909399;
  &.interacted {
    cursor: pointer;
    &:hover {
      opacity: 1;
    }
  }
  &::before {
    content: '';
    position: absolute;
    width: 14px;
    height: 14px;
    left: -5px;
    top: -5px;
  }
}

.textarea :deep(.el-textarea__inner) {
  resize: none;
}

.input :deep(.el-input__inner) {
  font-family: 'Times';
}

.invalid :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #f56c6c inset;
}

.ldap-login {
  grid-column: span 2;
}

.icon {
  cursor: pointer;
  &:hover {
    color: #909399;
  }
}

.remove:hover {
  color: #f56c6c;
  background: none;
  border-color: #dcdfe6;
}
</style>
