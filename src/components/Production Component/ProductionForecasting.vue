<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  forecastData: Array,
  forecastPeriod: String,
  isLoadingForecast: Boolean,
  generateForecast: Function,
})

const localForecastPeriod = ref(props.forecastPeriod || 'weekly')

// Sync local period with parent
watch(
  () => props.forecastPeriod,
  (val) => {
    localForecastPeriod.value = val
  },
)

const handleGenerate = () => {
  props.generateForecast(localForecastPeriod.value)
}

const hasData = computed(() => Array.isArray(props.forecastData) && props.forecastData.length > 0)
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-bold text-black">Production Forecasting & Insights</h2>
    </div>

    <!-- Forecast Controls -->
    <div class="bg-gray-50 p-4 rounded-lg mb-6">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-semibold text-gray-600">Forecast Period</label>
          <select
            v-model="localForecastPeriod"
            class="select !bg-white !border-black !text-black select-bordered w-full mt-1"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
        </div>
        <div class="flex items-end">
          <button
            class="btn-secondaryStyle w-full"
            @click="handleGenerate"
            :disabled="props.isLoadingForecast"
          >
            {{ props.isLoadingForecast ? 'Generating...' : 'Generate Forecast' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Forecast Results -->
    <div v-if="hasData" class="space-y-6">
      <!-- Overall Forecast Metrics -->
      <div class="grid grid-cols-3 gap-4">
        <div class="stat bg-blue-50 rounded-lg p-4">
          <div class="stat-title text-xs text-gray-500">Average MAE</div>
          <div class="stat-value text-blue-500 text-2xl">
            {{
              (
                props.forecastData.reduce((sum, p) => sum + p.metrics.mae, 0) /
                props.forecastData.length
              ).toFixed(1)
            }}
          </div>
        </div>
        <div class="stat bg-green-50 rounded-lg p-4">
          <div class="stat-title text-xs text-gray-500">Average RMSE</div>
          <div class="stat-value text-green-500 text-2xl">
            {{
              (
                props.forecastData.reduce((sum, p) => sum + p.metrics.rmse, 0) /
                props.forecastData.length
              ).toFixed(1)
            }}
          </div>
        </div>
        <div class="stat bg-purple-50 rounded-lg p-4">
          <div class="stat-title text-xs text-gray-500">Average Accuracy</div>
          <div class="stat-value text-purple-500 text-2xl">
            {{
              (
                (props.forecastData.reduce((sum, p) => sum + p.metrics.accuracy, 0) /
                  props.forecastData.length) *
                100
              ).toFixed(1)
            }}%
          </div>
        </div>
      </div>

      <!-- Product Forecasts -->
      <div
        v-for="product in props.forecastData"
        :key="product.product_name"
        class="bg-white rounded-lg shadow p-4"
      >
        <h3 class="text-lg font-semibold text-gray-800 mb-4">{{ product.product_name }}</h3>

        <!-- Product Metrics -->
        <div class="grid grid-cols-3 gap-4 mb-4">
          <div class="stat bg-blue-50 rounded-lg p-4">
            <div class="stat-title text-xs text-gray-500">MAE</div>
            <div class="stat-value text-blue-500 text-xl">{{ product.metrics.mae }}</div>
          </div>
          <div class="stat bg-green-50 rounded-lg p-4">
            <div class="stat-title text-xs text-gray-500">RMSE</div>
            <div class="stat-value text-green-500 text-xl">{{ product.metrics.rmse }}</div>
          </div>
          <div class="stat bg-purple-50 rounded-lg p-4">
            <div class="stat-title text-xs text-gray-500">Accuracy</div>
            <div class="stat-value text-purple-500 text-xl">
              {{ (product.metrics.accuracy * 100).toFixed(1) }}%
            </div>
          </div>
        </div>

        <!-- Forecast Table -->
        <div class="overflow-x-auto">
          <table class="table table-compact w-full">
            <thead>
              <tr class="bg-primaryColor text-white">
                <th class="text-xs">Period</th>
                <th class="text-xs">Historical Data</th>
                <th class="text-xs">Forecast</th>
                <th class="text-xs">Lower Bound</th>
                <th class="text-xs">Upper Bound</th>
              </tr>
            </thead>
            <tbody class="text-xs text-black">
              <tr v-for="(item, index) in product.historical_data" :key="'hist-' + index">
                <td>{{ item.date }}</td>
                <td>{{ item.actual }}</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr v-for="(item, index) in product.forecast" :key="'forecast-' + index">
                <td>{{ item.date }}</td>
                <td>-</td>
                <td>{{ item.predicted }}</td>
                <td>{{ item.lower_bound }}</td>
                <td>{{ item.upper_bound }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Product Recommendations -->
        <div class="mt-4 bg-gray-50 p-4 rounded-lg">
          <h4 class="text-sm font-semibold text-gray-600 mb-2">Recommendations</h4>
          <ul class="text-sm space-y-2">
            <li>
              • Prepare to produce {{ product.forecast[0].predicted }} units for
              {{ product.forecast[0].date }}
            </li>
            <li>
              • Expected range: {{ product.forecast[0].lower_bound }} -
              {{ product.forecast[0].upper_bound }} units
            </li>
            <li>• Forecast confidence: {{ (product.metrics.accuracy * 100).toFixed(1) }}%</li>
          </ul>
        </div>
      </div>
    </div>
    <div v-else class="text-center text-gray-400 mt-8">No forecast data available.</div>
  </div>
</template>
