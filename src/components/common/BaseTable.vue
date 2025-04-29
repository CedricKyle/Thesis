<script setup>
import { onMounted, ref, watch } from 'vue'
import { TabulatorFull as Tabulator } from 'tabulator-tables'

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  data: {
    type: Array,
    required: true,
    default: () => [],
  },
  columns: {
    type: Array,
    required: true,
  },
  options: {
    type: Object,
    default: () => ({}),
  },
  showExport: {
    type: Boolean,
    default: true,
  },
  rowFormatter: {
    type: Function,
    default: null,
  },
})

const emit = defineEmits(['row-click', 'row-edit', 'row-delete'])
const tableRef = ref(null)
let table = null

const defaultOptions = {
  height: '100%',
  layout: 'fitColumns',
  responsiveLayout: 'collapse',
  pagination: true,
  paginationSize: 10,
  paginationSizeSelector: [10, 25, 50],
  placeholder: 'No Data Available',
  cellVertAlign: 'middle',
  cssClass: 'custom-tabulator',
  headerBackgroundColor: '#466114',
}

onMounted(() => {
  const options = {
    ...defaultOptions,
    ...props.options,
    columns: props.columns,
    data: props.data,
  }
  if (props.rowFormatter) {
    options.rowFormatter = props.rowFormatter
  }
  table = new Tabulator(tableRef.value, options)

  // Handle row clicks
  table.on('rowClick', (e, row) => {
    emit('row-click', row.getData())
  })
})

// Watch for data changes
watch(
  () => props.data,
  (newData) => {
    if (table) {
      table.setData(newData)
    }
  },
  { deep: true },
)

defineExpose({
  table,
  refreshData: () => table?.setData(props.data),
  clearFilters: () => table?.clearFilter(true),
  clearSort: () => table?.clearSort(),
})
</script>

<template>
  <div class="w-full bg-white shadow-md">
    <!-- Table Header -->
    <div v-if="title || showExport" class="flex justify-between items-center p-4 border-b">
      <h2 v-if="title" class="text-xl font-semibold text-black">{{ title }}</h2>
      <div v-if="showExport" class="flex gap-2"></div>
    </div>

    <!-- Table Container -->
    <div ref="tableRef" class="tabulator-container"></div>
  </div>
</template>
