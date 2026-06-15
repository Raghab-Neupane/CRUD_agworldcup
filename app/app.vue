<template>
  <NuxtPage />
</template>

<script setup>
import { setApiBaseUrl } from './src/services/matchService';
import { useRuntimeConfig } from '#app';

const config = useRuntimeConfig();
setApiBaseUrl(config.public.apiBase);
</script>
