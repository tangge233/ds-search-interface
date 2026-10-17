<script setup lang="ts">
/** 结果占位骨架：结构对齐 SearchResultCard，减少数据到达时的跳动。 */
withDefaults(defineProps<{ rows?: number }>(), { rows: 3 })
</script>

<template>
  <div class="divide-y divide-default">
    <div v-for="row in rows" :key="row" class="grid grid-cols-[2rem_1fr] gap-x-3 py-5">
      <span class="pt-0.5 text-right font-mono text-xs text-dimmed">{{ row }}</span>
      <div class="space-y-2.5">
        <USkeleton class="h-3 w-40" />
        <USkeleton class="h-4 w-3/4" />
        <USkeleton class="h-3 w-full" />
        <USkeleton class="h-3 w-5/6" />
        <div class="flex gap-1.5 pt-0.5">
          <USkeleton class="h-5 w-16" />
          <USkeleton class="h-5 w-20" />
          <USkeleton class="h-5 w-16" />
        </div>
      </div>
    </div>
  </div>
</template>
