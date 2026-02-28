/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('tasks', table => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('description').notNullable();
    table.text('input_variables_json').notNullable().defaultTo('{}');
    table.text('repro_steps').notNullable();
    table.text('expected_result').notNullable();
    table.string('status').notNullable().defaultTo('waiting');
    table.string('assigned_agent').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('task_runs', table => {
    table.increments('id').primary();
    table.integer('task_id').unsigned().notNullable()
      .references('id')
      .inTable('tasks')
      .onDelete('CASCADE');
    table.timestamp('started_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('finished_at').notNullable().defaultTo(knex.fn.now());
    table.string('result').notNullable();
    table.text('failure_cause').nullable();
    table.string('agent_name').nullable();
    table.text('input_snapshot_json').notNullable().defaultTo('{}');
    table.text('expected_snapshot').notNullable().defaultTo('');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('task_runs');
  await knex.schema.dropTableIfExists('tasks');
};
