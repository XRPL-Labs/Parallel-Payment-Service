module.exports = {
  apps: [{
    name: 'ParallelPaymentService',
    script: 'index.mjs',
    watch: false,
    instances: 1,
    exec_mode: 'cluster',
    ignore_watch: ["node_modules", "db", ".git"],
    env: {
      DEBUG: 'accacser:*'
    },
    env_production: {
      DEBUG: 'accacser:*'
    }
  }]
}
