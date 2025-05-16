<template>
  <div class="bg-primaryColor w-full min-h-screen p-8">
    <!-- Main Feedback Card -->
    <div class="w-[900px] h-full mx-auto bg-primaryColor rounded-xl overflow-hidden my-15">
      <div class="flex flex-col md:flex-row">
        <!-- Left Side - Logo and Thank You Message -->
        <div class="bg-orange-500 p-8 md:w-2/5">
          <div class="flex justify-center mb-6">
            <img src="@/assets/logo1.png" alt="Countryside Steakhouse Logo" class="w-64 h-64 rounded-full"/>
          </div>
          
          <div class="text-white">
            <h2 class="text-4xl font-bold mb-2">Thank you, dear customer!</h2>
            <p >We appreciate your visit to our steakhouse</p>
            <p >and hope you had a delicious dining experience.</p>
            <p >Please share your feedback with us we're always</p>
            <p >looking for ways to serve you better and make your next meal even more satisfying.</p>
            <p >Looking forward to seeing you again for another sizzling steak feast!</p>
            <p>Let me know if you'd like any further refinements</p>
          </div>
        </div>
        
        <!-- Right Side - Feedback Form -->
        <div class="bg-orange-500 p-8 md:w-3/5">
          <h2 class="text-3xl font-bold text-white mb-6">Feedback Form</h2>
          
          <form @submit.prevent="submitFeedback" class="space-y-3">
            <div>
              <label class="block text-white mb-2">Name:</label>
              <input 
                v-model="feedbackForm.name"
                type="text"
                placeholder="Enter Name"
                class="w-full px-4 py-3 bg-white  rounded-lg focus:outline-none"
                required
              />
            </div>
            
            <div>
              <label class="block text-white mb-2">Email:</label>
              <input 
                v-model="feedbackForm.email"
                type="email"
                placeholder="Enter Email"
                class="w-full px-4 py-3 bg-white  rounded-lg focus:outline-none"
                required
              />
            </div>

            <div>
              <label class="block text-white mb-2">Message:</label>
              <textarea 
                v-model="feedbackForm.message"
                rows="6"
                placeholder="Enter Message"
                class="w-full px-4 py-3 bg-white rounded-lg focus:outline-none"
                required
              ></textarea>
            </div>

            <button 
              type="submit"
              class="bg-primaryColor text-white font-bold py-3 px-6 rounded-lg hover:bg-green-800 transition"
            >
              Submit Feedback
            </button>
          </form>
        </div>
      </div>
    </div>
    
    <!-- Contact Us Section -->
    <div class="max-w-6xl mx-auto mt-12">
      <h2 class="text-4xl font-bold text-white mb-8">Contact Us</h2>
      
      <div class="flex flex-col space-y-6">
        <div class="flex items-center text-white">
          <div class="w-16 h-16 rounded-full border-2 border-orange-500 flex items-center justify-center mr-4">
            <i class="pi pi-facebook text-2xl text-orange-500"></i>
          </div>
          <span class="text-xl">@PNCountryside</span>
        </div>
        
        <div class="flex items-center text-white">
          <div class="w-16 h-16 rounded-full border-2 border-orange-500 flex items-center justify-center mr-4">
            <i class="pi pi-envelope text-2xl text-orange-500"></i>
          </div>
          <span class="text-xl">countryside_steakhouse@yahoo.com.ph</span>
        </div>
        
        <div class="flex items-center text-white">
          <div class="w-16 h-16 rounded-full border-2 border-orange-500 flex items-center justify-center mr-4">
            <i class="pi pi-phone text-2xl text-orange-500"></i>
          </div>
          <span class="text-xl">0998 359 5987 / (046) 852-0030</span>
        </div>
      </div>
    </div>
    
    
  </div>
</template>

<script setup>
import { ref } from 'vue'

const feedbackForm = ref({
  name: '',
  email: '',
  message: ''
})

const submitFeedback = () => {
  // Here you would typically send the feedback to your backend
  console.log('Feedback submitted:', feedbackForm.value)
  
  // Reset form
  feedbackForm.value = {
    name: '',
    email: '',
    message: ''
  }
}
</script>

<style scoped>
/* Additional custom styles if needed */
</style> 