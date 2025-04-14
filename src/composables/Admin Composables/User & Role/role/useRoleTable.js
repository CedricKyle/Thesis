import { ref } from 'vue'
import { TabulatorFull as Tabulator } from 'tabulator-tables'

export function useRoleTable({ onView, onEdit, onDelete, onDuplicate } = {}) {
  const tableRef = ref(null)
  const isTableBuilt = ref(false)
  let table = null

  const columns = [
    {
      title: 'Role Name',
      field: 'role_name',
      sorter: 'string',
      headerSort: true,
      width: 300,
    },
    {
      title: 'Description',
      field: 'description',
      sorter: 'string',
      headerSort: true,
      width: 464,
      formatter: (cell) => {
        const value = cell.getValue() || ''
        return `<div class="truncate" title="${value}">${value}</div>`
      },
    },
    {
      title: 'Last Modified',
      field: 'last_modified',
      sorter: 'date',
      headerSort: true,
      width: 200,
      formatter: (cell) => {
        const date = new Date(cell.getValue())
        return date
          .toLocaleString('en-PH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'Asia/Manila',
          })
          .replace(',', '')
      },
    },
    {
      title: 'Actions',
      width: 150,
      cssClass: 'actions-column',
      formatter: function (cell) {
        return `
          <div class="flex gap-2 bg-white w-full">
            <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost view-button" title="View Permissions">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                <path d="M2 12s3-9 10-9 10 9 10 9-3 9-10 9-10-9-10-9z"/>
              </svg>
            </button>
            <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost edit-button">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button class="btn btn-sm btn-circle hover:bg-secondaryColor border-none btn-ghost duplicate-button">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
            <button class="btn btn-sm btn-circle hover:bg-red-400 border-none btn-ghost delete-button">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>`
      },
      headerSort: false,
      cellClick: function (e, cell) {
        const record = cell.getRow().getData()
        const button = e.target.closest('button')
        if (!button) return

        const handlers = {
          'view-button': () => onView?.(record),
          'edit-button': () => onEdit?.(record),
          'delete-button': () => onDelete?.(record),
          'duplicate-button': () => onDuplicate?.(record),
        }

        const buttonClass = button.classList.toString().match(/\w+-button/)?.[0]
        if (buttonClass && handlers[buttonClass]) {
          handlers[buttonClass]()
        }
      },
    },
  ]

  const initTable = async (data, options = {}) => {
    if (tableRef.value) {
      table = new Tabulator(tableRef.value, {
        data,
        columns,
        layout: 'fitColumns',
        responsiveLayout: 'collapse',
        height: '100%',
        pagination: true,
        paginationSize: 10,
        paginationSizeSelector: [10, 25, 50],
        placeholder: 'No roles available',
        cssClass: 'custom-tabulator',
        rowBackgroundColor: 'white',
        ...options,
      })

      const style = document.createElement('style')
      style.textContent = `
        /* Table specific styles */
        .custom-tabulator {
          background-color: white !important;
          border: none !important;
          position: relative;
          z-index: 1;
        }
        .custom-tabulator .tabulator-tableholder {
          background-color: white !important;
          overflow-y: auto !important;
        }
        .custom-tabulator .tabulator-table {
          background-color: white !important;
        }
        .custom-tabulator .tabulator-row {
          background-color: white !important;
          border-bottom: 1px solid #eee;
        }
        .custom-tabulator .tabulator-row.tabulator-row-even {
          background-color: white !important;
        }
        .custom-tabulator .tabulator-row.tabulator-row-odd {
          background-color: white !important;
        }
        .custom-tabulator .tabulator-cell {
          background-color: white !important;
        }
        .custom-tabulator .tabulator-header {
          background-color: #4D7C0F !important;
          color: white !important;
          border-bottom: none;
        }
        .custom-tabulator .tabulator-footer {
          background-color: white !important;
          border-top: 1px solid #eee;
        }
        .custom-tabulator .tabulator-footer-contents {
          background-color: white !important;
        }
        .custom-tabulator .tabulator-paginator {
          background-color: white !important;
        }
        .custom-tabulator .tabulator-page {
          background-color: white !important;
        }
        .custom-tabulator .tabulator-page.active {
          background-color: #4D7C0F !important;
          color: white !important;
        }

        /* Modal styles */
        .modal {
          background: rgba(0, 0, 0, 0.5) !important;
          z-index: 100 !important;
        }
        .modal-box {
          background: white !important;
          z-index: 101 !important;
        }
      `
      document.head.appendChild(style)

      await table.on('tableBuilt', () => {
        isTableBuilt.value = true
      })
    }
  }

  const updateTableData = async (data) => {
    if (table) {
      await table.setData(data)
    }
  }

  const destroyTable = () => {
    if (table) {
      table.destroy()
      table = null
    }
  }

  return {
    tableRef,
    isTableBuilt,
    initTable,
    updateTableData,
    destroyTable,
  }
}
