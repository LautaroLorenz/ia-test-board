/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const hasTaskRuns = await knex.schema.hasTable('task_runs');
  if (!hasTaskRuns) {
    return;
  }

  const hasRunGroupColumn = await knex.schema.hasColumn('task_runs', 'run_group_id');
  if (hasRunGroupColumn) {
    await knex.schema.createTable('task_runs_tmp', table => {
      table.increments('id').primary();
      table.integer('task_id').unsigned().notNullable()
        .references('id')
        .inTable('tasks')
        .onDelete('CASCADE');
      table.timestamp('started_at').notNullable();
      table.timestamp('finished_at').notNullable();
      table.string('result').notNullable();
      table.text('failure_cause').nullable();
      table.string('agent_name').nullable();
      table.text('input_snapshot_json').notNullable().defaultTo('{}');
      table.text('expected_snapshot').notNullable().defaultTo('');
      table.timestamp('created_at').notNullable();
    });

    await knex.raw(`
      INSERT INTO task_runs_tmp (
        id,
        task_id,
        started_at,
        finished_at,
        result,
        failure_cause,
        agent_name,
        input_snapshot_json,
        expected_snapshot,
        created_at
      )
      SELECT
        id,
        task_id,
        started_at,
        finished_at,
        result,
        failure_cause,
        agent_name,
        input_snapshot_json,
        expected_snapshot,
        created_at
      FROM task_runs
    `);

    await knex.schema.dropTable('task_runs');
    await knex.schema.renameTable('task_runs_tmp', 'task_runs');
  }

  const hasRunGroups = await knex.schema.hasTable('run_groups');
  if (hasRunGroups) {
    await knex.schema.dropTable('run_groups');
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.raw('select 1');
};
