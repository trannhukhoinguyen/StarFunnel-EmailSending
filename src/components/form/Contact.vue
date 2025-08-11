<template>
  <form @submit.prevent="submit" class="grid gap-4">
    <div class="pb-8">
      <h2 class="subtitle">{{ contact?.title }}</h2>
      <slot name="text" />
    </div>

    <!-- Chọn topic nếu có nhiều -->
    <div class="input-group z-20 w-full" v-if="contact.topics.length > 1">
      <Popper placement="bottom-start" offsetDistance="1" :show="showPopper" class="w-full">
        <button type="button" @click="showPopper = !showPopper" class="select w-full text-left">
          {{ !!topic ? topic : "Select" }}
        </button>

        <template #content>
          <ul>
            <li
                v-for="(item, index) in contact.topics"
                :key="index"
                :class="topic == item.label ? 'bg-dark bg-opacity-10' : ''"
            >
              <button
                  type="button"
                  class="w-full p-2 text-left hover:bg-dark hover:bg-opacity-10"
                  @click="
                  setTopic(item);
                  showPopper = false;
                "
              >
                {{ item.label }}
              </button>
            </li>
          </ul>
        </template>
      </Popper>

      <label>{{ t('topic') }} *</label>
    </div>

    <!-- Name -->
    <div class="input-group">
      <input type="text" name="name" placeholder=" " class="peer" v-model="form.name" />
      <label>{{ t('name') }} *</label>
    </div>

    <!-- Email -->
    <div class="input-group">
      <input type="email" name="email" placeholder=" " class="peer" v-model="form.email" />
      <label>{{ t('email') }} *</label>
    </div>

    <!-- Phone -->
    <div class="input-group">
      <input type="text" name="phone" placeholder=" " class="peer" v-model="form.phone" />
      <label>{{ t('phone') }}</label>
    </div>

    <!-- Message -->
    <div class="input-group">
      <textarea
          class="hide-scrollbar peer"
          name="message"
          placeholder=" "
          cols="30"
          rows="2"
          ref="textarea"
          v-model="input"
      ></textarea>
      <label>{{ t('message') }} *</label>
    </div>

    <!-- Submit -->
    <div class="pointer-events-none sticky bottom-0 right-5 flex justify-end md:translate-y-10">
      <button
          class="btn surface-primary group pointer-events-auto mb-auto ml-auto"
          type="submit"
          :disabled="!canSubmit"
      >
        <span>{{ t('submit') }}</span>
      </button>
    </div>

    <Loading :loading="loading" />
  </form>
</template>

<script setup lang="ts">
import { ref, watch, reactive, computed } from "vue";
import { t } from "@util/translate";
import { useStore } from "@nanostores/vue";
import { showDialog } from "@src/store";
import { useAsyncValidator } from "@vueuse/integrations/useAsyncValidator";
import { useTextareaAutosize } from "@vueuse/core";
import Loading from "@components/common/Loading.vue";
import "vue3-toastify/dist/index.css";
import { toast } from "vue3-toastify";
import Popper from "vue3-popper";

const props = defineProps({
  contact: {
    type: Object,
  },
});

const $showDialog = useStore(showDialog);
const form = reactive({ email: "", name: "", message: "", phone: "" });
const { textarea, input } = useTextareaAutosize();

const rules = {
  email: [{ type: "email", required: true }],
  name: [{ type: "string", required: true }],
  message: [{ type: "string", min: 2, required: true }],
};
const { pass, isFinished } = useAsyncValidator(form, rules);

const topic = ref(null);
const showPopper = ref(false);
const loading = ref(false);
const topicChannel = ref(null);
const topicEmail = ref(null);

const hide = () => {
  showDialog.set({
    type: $showDialog.value.type,
    slug: $showDialog.value.slug,
    show: false,
  });
};

const setTopic = (data: any) => {
  topic.value = data.label;
  topicEmail.value = data.email;
  topicChannel.value = data.slack_id;
};

if (props.contact.topics.length === 1) {
  setTopic(props.contact.topics[0]);
}

const canSubmit = computed(() => {
  return !loading.value && isFinished.value && pass.value && !!topic.value;
});

const mailData = computed(() => {
  return {
    email: form.email,
    name: form.name,
    message: `
      Topic:  ${topic.value}\r\n
      Name: ${form.name}\r\n
      Phone: ${form.phone}\r\n
      Email: ${form.email}\r\n
      Message: ${form.message}\r\n
    `,
  };
});

const submit = () => {
  loading.value = true;

  fetch(`/api/emailjs`, {
    method: "POST",
    body: JSON.stringify(mailData.value),
    headers: { "Content-Type": "application/json" },
  })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          toast.success(t("contact_thanks"));
          form.email = "";
          form.name = "";
          form.phone = "";
          form.message = "";
          input.value = "";
          hide();
        } else {
          toast.error(data.error || t("contact_error"));
        }
      })
      .catch((e) => {
        console.error("error", e);
        toast.error(t("contact_error"));
      })
      .finally(() => {
        loading.value = false;
      });
};

watch(input, (val) => {
  form.message = val;
});
</script>

<style lang="postcss" scoped>
.input-group {
  @apply relative isolate;
  input,
  textarea,
  .select {
    @apply block w-full appearance-none border-0 border-b border-gray-500 bg-transparent px-0 py-2.5 text-sm text-current focus:border-primary focus:outline-none focus:ring-0;
  }
  label {
    @apply pointer-events-none absolute left-0 top-3 z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-current duration-300;
  }
}
</style>
