<template>
  <div
    ref="container"
    class="z-20 grid h-full max-h-screen w-full place-items-center justify-center overflow-hidden"
  >
    <div @wheel="panzoom.zoomWithWheel">
      <div ref="zoom" class="max-w-screen relative max-h-screen">
        <slot />
      </div>
    </div>
  </div>
</template>
<script setup>
import Panzoom from "@panzoom/panzoom";
import { ref, onMounted } from "vue";

const zoom = ref(null);
const container = ref(null);
const panzoom = ref(null);
const props = defineProps({
  alt: {
    type: String,
    required: true,
  },
});

/*onMounted(() => {
  panzoom.value = Panzoom(zoom.value, {
    maxScale: 5,
    minScale: 0.8,
    overflow: "visible",
  });
});*/

onMounted(() => {
  if (container.value) {
    const panzoom = Panzoom(container.value, {
      maxScale: 5,
      contain: 'outside',
      minScale: 0.8,
      overflow: "visible",
    });

    // Cho phép cuộn để zoom
    container.value.parentElement.addEventListener('wheel', panzoom.zoomWithWheel);
  }
});
</script>
