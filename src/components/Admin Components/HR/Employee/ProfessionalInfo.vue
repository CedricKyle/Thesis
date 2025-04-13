<script setup>
import { Upload } from 'lucide-vue-next'
import { useResumeUpload } from '@/composables/Admin Composables/Human Resource/useResumeUpload'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  formErrors: {
    type: Object,
    required: true,
  },
  roles: {
    type: Array,
    required: true,
  },
  showToastMessage: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const { resumeFile, resumeFileName, isProcessing, handleResumeUpload, removeResume } =
  useResumeUpload(props.showToastMessage)

const departmentJobs = {
  'HR Department': ['HR Manager'],
  'Finance Department': ['Accountant'],
  'Sales Department': ['Sales Manager'],
  'Customer Service Department': ['Customer Service Representative'],
  'Supply Chain Department': ['Supply Chain Manager'],
}

const availableJobs = computed(() => {
  if (!props.modelValue.department) return []
  return departmentJobs[props.modelValue.department] || []
})

const updateField = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value,
  })
}

watch(
  () => props.modelValue.department,
  () => {
    updateField('jobTitle', '')
  },
)

const handleResume = async (event) => {
  const file = await handleResumeUpload(event)
  updateField('resume', file)
}
</script>

<!-- Template section remains mostly the same but with updated bindings -->
