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

  <el-select placeholder="Тип" :model-value="draft.type" @update:model-value="updateType">
    <el-option label="LDAP" value="LDAP" />
    <el-option label="Локальная" value="LOCAL" />
  </el-select>

  <el-input
    :model-value="draft.login"
    :maxlength="100"
    class="input"
    :class="{ invalid: isInvalid('login'), 'ldap-login': draft.type === 'LDAP' }"
    ref="loginRef"
    @update:model-value="emit('patch', { login: $event })"
    @blur="emit('save')"
  />

  <el-input
    v-if="draft.type === 'LOCAL'"
    :model-value="draft.password"
    :type="showPassword ? 'text' : 'password'"
    :maxlength="100"
    class="input"
    :class="{ invalid: isInvalid('password') }"
    ref="passwordRef"
    @blur="emit('save')"
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
  errors?: AccountErrors
}>()

const emit = defineEmits<{
  (e: 'patch', diff: Partial<AccountDraft>): void
  (e: 'remove'): void
  (e: 'save'): void
}>()

type InputRefValue = InstanceType<(typeof import('element-plus'))['ElInput']> | null
const labelsRef = ref<InputRefValue>(null)
const loginRef = ref<InputRefValue>(null)
const passwordRef = ref<InputRefValue>(null)

type FieldWithValidation = 'login' | 'password'
const willFocus = ref<FieldWithValidation | null>(null)

onMounted(async () => {
  if (!props.draft.login) {
    await nextTick()
    loginRef.value?.focus()
  }
})

watch(
  () => props.draft.type,
  (type) => {
    if (props.errors?.login) {
      focusField('login', loginRef)
    } else if (type === 'LOCAL' && !props.draft.password) {
      focusField('password', passwordRef)
    }
  },
)

async function focusField(field: FieldWithValidation, ref: { value: InputRefValue }) {
  // с помощью willFocus предотвращаем мерцание красным при появлении поля "пароль"
  willFocus.value = field

  await nextTick()
  ref.value?.focus()

  willFocus.value = null
}

function isInvalid(field: FieldWithValidation) {
  return willFocus.value !== field && props.errors?.[field]
}

useResizeObserver(labelsRef, () => labelsRef.value?.resizeTextarea?.())

const showPassword = ref(false)

function updateType(type: AccountDraft['type']) {
  emit('patch', { type })
  emit('save')
}
</script>

<style scoped>
.textarea :deep(.el-textarea__inner) {
  resize: none;
}

.input :deep(.el-input__inner) {
  font-family: 'Times';
}

.invalid :deep(.el-input__wrapper:not(.is-focus)) {
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
