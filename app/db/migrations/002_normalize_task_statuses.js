/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex('tasks').where({ status: 'in_progress' }).update({ status: 'executing' });
  await knex('tasks').where({ status: 'finalizado' }).update({ status: 'finished' });
  await knex('tasks').where({ status: 'finalized' }).update({ status: 'finished' });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.raw('select 1');
};
