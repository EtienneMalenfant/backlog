<template>
  <div class="db-location">
    <div>{{$t('modals.database_location')}}</div>
    <Input v-model="dbLocation" disabled="disabled"/>
  </div>
</template>

<script>
  export default {
    name: 'DatabaseLocation',
    computed: {
      dbLocation: {
        get () {
          return this.$store.state.settings.dbLocation;
        },
        set () {
          // TODO: when implementing customizing db location
        }
      }
    },
    created () {
      if (!this.dbLocation) {
        const userDataPath = window.electronAPI.app.getUserDataPath() || '';
        this.$store.dispatch('setDbLocation', userDataPath);
      }
    }
  };
</script>

<style scoped>
  .db-location {
    margin-bottom: 15px;
  }
</style>
