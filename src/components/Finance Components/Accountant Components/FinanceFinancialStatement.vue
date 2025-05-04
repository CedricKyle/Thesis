<script setup>
import ExpensesImage from '@/assets/Images/expenses.png'
import BalanceImage from '@/assets/Images/balance.png'
import BudgetImage from '@/assets/Images/money-bag.png'
import ProfitImage from '@/assets/Images/profit (1).png'
import { EllipsisVertical } from 'lucide-vue-next'
</script>

<template>
  <div class="grid grid-cols-4 grid-rows-[auto_auto_auto_auto] gap-4 text-black">
    <!-- Stats Grid -->
    <div class="col-span-4 flex gap-7 justify-between">
      <div>
        <div class="card bg-white w-60 shadow-md">
          <div class="card-body">
            <div class="card-header flex flex-row gap-2 justify-between">
              <div><h1 class="text-xl font-bold text-gray-600">Balance</h1></div>
              <div><EllipsisVertical class="w-4 h-4" /></div>
            </div>
            <div class="card-content mt-4 flex flex-row gap-2 justify-between">
              <div>
                <h1 class="text-primaryColor text-4xl font-bold">₱ 4,320</h1>
              </div>
              <div class="w-11">
                <img :src="ExpensesImage" alt="Expenses" class="w-11 h-11" />
              </div>
            </div>
            <div
              class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
            ></div>
            <div class="text-sm text-gray-500 mt-2">April 2025</div>
          </div>
        </div>
      </div>
      <div>
        <div class="card bg-white w-60 shadow-md">
          <div class="card-body">
            <div class="card-header flex flex-row gap-2 justify-between">
              <div><h1 class="text-xl font-bold text-gray-600">Expenses</h1></div>
              <div><EllipsisVertical class="w-4 h-4" /></div>
            </div>
            <div class="card-content mt-4 flex flex-row gap-2 justify-between">
              <div>
                <h1 class="text-primaryColor text-4xl font-bold">₱ 3,320</h1>
              </div>
              <div class="w-11">
                <img :src="BalanceImage" alt="Balance" />
              </div>
            </div>
            <div
              class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
            ></div>
            <div class="text-sm text-gray-500 mt-2">April 2025</div>
          </div>
        </div>
      </div>
      <div>
        <div class="card bg-white w-60 shadow-md">
          <div class="card-body">
            <div class="card-header flex flex-row gap-2 justify-between">
              <div><h1 class="text-xl font-bold text-gray-600">Budget</h1></div>
              <div><EllipsisVertical class="w-4 h-4" /></div>
            </div>
            <div class="card-content mt-4 flex flex-row gap-2 justify-between">
              <div>
                <h1 class="text-primaryColor text-4xl font-bold">₱ 1,370</h1>
              </div>
              <div class="w-11">
                <img :src="BudgetImage" alt="Budget" />
              </div>
            </div>
            <div
              class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
            ></div>
            <div class="text-sm text-gray-500 mt-2">April 2025</div>
          </div>
        </div>
      </div>
      <div>
        <div class="card bg-white w-60 shadow-md">
          <div class="card-body">
            <div class="card-header flex flex-row gap-2 justify-between">
              <div><h1 class="text-xl font-bold text-gray-600">Income</h1></div>
              <div><EllipsisVertical class="w-4 h-4" /></div>
            </div>
            <div class="card-content mt-4 flex flex-row gap-2 justify-between">
              <div>
                <h1 class="text-primaryColor text-4xl font-bold">₱300</h1>
              </div>
              <div class="w-11">
                <img :src="ProfitImage" alt="Profit" />
              </div>
            </div>
            <div
              class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
            ></div>
            <div class="text-sm text-gray-500 mt-2">April 2025</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Financial Statement Table Below Cards -->
    <div class="col-span-4 mt-8">
      <h3 class="text-xl font-semibold mb-4">Financial Summary</h3>
      <div class="overflow-x-auto">
        <table class="table w-full text-sm rounded-md">
          <thead>
            <tr class="bg-gray-100">
              <th>Period</th>
              <th class="text-right">Income (₱)</th>
              <th class="text-right">Expenses (₱)</th>
              <th class="text-right">Budget (₱)</th>
              <th class="text-right">Balance (₱)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>April 2025</td>
              <td class="text-right">300</td>
              <td class="text-right">3,320</td>
              <td class="text-right">1,370</td>
              <td class="text-right">4,320</td>
            </tr>
            <tr>
              <td>March 2025</td>
              <td class="text-right">1,000</td>
              <td class="text-right">2,800</td>
              <td class="text-right">1,500</td>
              <td class="text-right">2,700</td>
            </tr>
            <tr>
              <td>February 2025</td>
              <td class="text-right">2,500</td>
              <td class="text-right">2,500</td>
              <td class="text-right">1,000</td>
              <td class="text-right">3,000</td>
            </tr>
          </tbody>
          <tfoot class="font-bold bg-gray-50">
            <tr>
              <td>Total</td>
              <td class="text-right">₱3,800</td>
              <td class="text-right">₱8,620</td>
              <td class="text-right">₱3,870</td>
              <td class="text-right">₱10,020</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>
