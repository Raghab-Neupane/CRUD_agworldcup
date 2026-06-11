<template>
  <MatchManagement />
</template>

<script setup>
import MatchManagement from './src/views/MatchManagement.vue';
import { setApiBaseUrl } from './src/services/matchService';
import { useRuntimeConfig } from '#app';

const config = useRuntimeConfig();
setApiBaseUrl(config.public.apiBase);
</script>
