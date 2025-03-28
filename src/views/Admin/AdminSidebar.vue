<script setup>
import HumanResourceManagement from './HumanResourceManagement.vue'
import CRMManagement from './CRMManagement.vue'
import FinancialManagement from './FinancialManagement.vue'
import InventoryManagement from './InventoryManagement.vue'
import SalesManagement from './SalesManagement.vue'

//this is sub menu
import PayrollManagement from '../Human Resource/PayrollManagement.vue'
import Recruitment from '../Human Resource/Recruitment.vue'

//this is import icons
import { UserCog, Landmark, ChartNoAxesColumnIncreasing, Archive, Mail } from 'lucide-vue-next'

import { ref } from 'vue'

const currentTab = ref('Human Resource')

const tabs = {
  'Human Resource': {
    component: HumanResourceManagement,
    icon: UserCog,
    submenu: {
      Payroll: PayrollManagement,
      Recruitment: Recruitment,
    },
  },
  Finance: { component: FinancialManagement, icon: Landmark },
  Sales: { component: SalesManagement, icon: ChartNoAxesColumnIncreasing },
  Inventory: { component: InventoryManagement, icon: Archive },
  CRM: { component: CRMManagement, icon: Mail },
}

const setTab = (tabName, parentTab = null) => {
  if (parentTab) {
    currentTab.value = tabName
  } else {
    currentTab.value = tabName
  }
}
</script>

<template>
  <div class="flex">
    <!-- Sidebar -->
    <div class="w-80 min-h-screen p-4 bg-primaryColor">
      <div class="logo-section flex items-center mb-5 gap-4">
        <div class="logo-content">
          <img
            src="../../assets/Images/countryside-logo.png"
            alt="this is logo"
            class="w-20 h-20"
          />
        </div>
        <div class="text-log">
          <h1 class="text-[25px] text-secondaryColor">Countryside</h1>
          <p class="text-[12px] text-gray-300">1984</p>
        </div>
      </div>
      <ul class="menu w-full text-base-content">
        <li v-for="(tab, tabName) in tabs" :key="tabName">
          <template v-if="tab.submenu">
            <details :open="currentTab in tab.submenu">
              <summary class="flex items-center">
                <component :is="tab.icon" class="w-6 h-6 mr-3" />
                {{ tabName }}
              </summary>
              <ul class="pl-10">
                <li v-for="(subComp, subTab) in tab.submenu" :key="subTab">
                  <a
                    :class="[
                      'flex items-center px-4 py-2 transition',
                      currentTab === subTab
                        ? 'bg-[rgba(217,217,217,0.15)] text-white' /* Active state with 30% opacity */
                        : 'hover: text-gray-300' /* Default & hover */,
                    ]"
                    @click="setTab(subTab, tabName)"
                  >
                    {{ subTab }}
                  </a>
                </li>
              </ul>
            </details>
          </template>
          <template v-else>
            <a
              :class="[
                'flex items-center px-4 py-2 transition',
                currentTab === tabName
                  ? 'bg-[rgba(217,217,217,0.15)] text-white' /* Active state with 30% opacity */
                  : 'hover: text-gray-300' /* Default & hover */,
              ]"
              @click="setTab(tabName)"
            >
              <component :is="tab.icon" class="w-6 h-6 mr-3" />
              {{ tabName }}
            </a>
          </template>
        </li>
      </ul>
    </div>

    <!-- Main Content -->
    <div class="flex-1 p-6 bg-bgColor">
      <component
        v-if="
          currentTab && (tabs[currentTab]?.component || tabs['Human Resource'].submenu[currentTab])
        "
        :is="tabs[currentTab]?.component || tabs['Human Resource'].submenu[currentTab]"
      ></component>
    </div>
  </div>
</template>
