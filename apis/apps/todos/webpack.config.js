module.exports = (options) => ({
  ...options,
  externals: [
    ...(options.externals || []),
    // Optional knex/MikroORM database drivers not used by this app
    'mysql', 'mysql2', 'oracledb', 'pg-query-stream',
    'sqlite3', 'tedious', 'mariadb/callback', 'libsql',
  ],
});
