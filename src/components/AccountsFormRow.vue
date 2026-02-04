<template>
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
      'can-invalid-focused': canInvalidFocused.login,
      'ldap-login': draft.type === 'LDAP',
    }"
    ref="loginRef"
    @update:model-value="emit('patch', { login: $event })"
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
      'can-invalid-focused': canInvalidFocused.password,
    }"
    ref="passwordRef"
    @blur="onBlurWithValidation('password')"
    @update:model-value="emit('patch', { password: $event })"
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
import { nextTick, onMounted, ref, watch } from 'vue'
import { useResizeObserver } from '../hooks/useResizeObserver'
import { View, Hide } from '@element-plus/icons-vue'

export type AccountDraft = Omit<Account, 'labels'> & {
  id: string
  labels: string
}

export type AccountErrors = Partial<Record<keyof AccountDraft, boolean>>

const props = defineProps<{
  draft: AccountDraft
  errors: AccountErrors
}>()

const emit = defineEmits<{
  (e: 'patch', diff: Partial<AccountDraft>): void
  (e: 'remove'): void
  (e: 'save'): void
}>()

const showPassword = ref(false)

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
const canInvalidFocused = ref<Record<FieldWithValidation, boolean>>({
  ...canInvalid.value,
})

onMounted(() => {
  if (!props.draft.login) focusField(loginRef)
})

watch(
  () => props.draft.type,
  () => emit('save'),
)

fieldsWithValidation.forEach((field) => {
  watch(
    () => props.draft[field],
    () => {
      if (!props.errors[field]) {
        canInvalid.value[field] = true
        canInvalidFocused.value[field] = true
      }
    },
  )
})

watch(
  () => props.draft.type,
  (type) => {
    if (props.errors.login) {
      focusField(loginRef)
    } else if (type === 'LOCAL' && props.errors.password) {
      canInvalidFocused.value.password = true
      focusField(passwordRef)
    }
  },
)

useResizeObserver(labelsRef, () => labelsRef.value?.resizeTextarea?.())

function onBlurWithValidation(field: FieldWithValidation) {
  canInvalid.value[field] = true
  canInvalidFocused.value[field] = true
  if (field === 'login') canInvalid.value.password = true
  emit('save')
}

function isInvalid(field: FieldWithValidation) {
  return canInvalid.value[field] && props.errors[field]
}

async function focusField(ref: { value: InputRefValue }) {
  await nextTick()
  ref.value?.focus()
}
</script>

<style scoped>
.textarea :deep(.el-textarea__inner) {
  resize: none;
}

.input :deep(.el-input__inner) {
  font-family: 'Times';
}

.invalid {
  & :deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px #f56c6c inset;
  }
  &:not(.can-invalid-focused) :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px #409eff inset;
  }
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
