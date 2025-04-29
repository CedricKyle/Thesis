<script setup>

</script>

<template>
    <div>
        <h1>this is Payroll Record</h1>
        <div class="overflow-x-auto mt-6">
                <table class="min-w-full border border-green-900 bg-white text-[10px]">
                <tr >
                    <th class="border  border-green-900 px-4 py-2 text-left">NAME</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">DEPARTMENT</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">PRESENT</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">ABSENT</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">BASE SALARY</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">OVERTIME</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">DEDUCTION</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">NET PAY</th>
                    <th class="border  border-green-900 px-4 py-2 text-center">ACTION</th>
                </tr>
                <tr>
                    <th class="border  border-green-900 px-4 py-2 text-left">Marco Paja</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">HR</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">20</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">2</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">₱20,000</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">₱1,000</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">₱1,818.18</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">₱19,181.82</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">  <button class="bg-red-500 rounded-[5px] w-[60px] h-[30px]">PENDING</button> </th>
                </tr>
                <tr>
                    <th class="border  border-green-900 px-4 py-2 text-left">Charles Alvaran</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">Sales</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">19</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">3</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">₱20,000</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">None</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">₱2,727.27</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">₱17,272.73</th>
                    <th class="border  border-green-900 px-4 py-2 text-left"> <button class="bg-red-500 rounded-[5px] w-[60px] h-[30px]">PENDING</button> </th>
                </tr>
            </table>
            </div>
            <h1>this is Transaction Record</h1>
                <div class="overflow-x-auto mt-6">
                <table class="min-w-full border border-green-900 bg-white text-[10px]">
                <tr>
                    <th class="border  border-green-900 px-4 py-2 text-left">Date</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">Name</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">Phone number</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">Location</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">Product</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">Quantity</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">Unit price</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">Total price</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">Status</th>
                </tr>
                <tr>
                    <th class="border  border-green-900 px-4 py-2 text-left">4/29/2025</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">Marco Paja</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">093273827</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">Dasma</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">Pork meat</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">50kg</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">₱300</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">₱15,000</th>
                    <th class="border  border-green-900 px-4 py-2 text-left"><button class="bg-red-500 rounded-[5px] w-[60px] h-[30px]">Pending</button></th>
                </tr>
                <tr>
                    <th class="border  border-green-900 px-4 py-2 text-left">4/29/2025</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">Charles Alvaran</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">092328447</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">pala pala</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">Beef meat</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">50kg</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">₱450</th>
                    <th class="border  border-green-900 px-4 py-2 text-left">₱22, 500</th>
                    <th class="border  border-green-900 px-4 py-2 text-left"><button class="bg-green-500 rounded-[5px] w-[60px] h-[30px]">Completed</button></th>
                </tr>
            </table>
            </div>
    </div>
    
</template>


