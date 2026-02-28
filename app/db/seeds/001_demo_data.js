/**
 * @param {import('knex').Knex} knex
 */
exports.seed = async function seed(knex) {
  await knex('task_runs').del();
  await knex('run_groups').del();
  await knex('tasks').del();

  const [runGroupId] = await knex('run_groups').insert({
    triggered_by: 'seed',
    started_at: knex.fn.now(),
    finished_at: knex.fn.now(),
    created_at: knex.fn.now()
  });

  const [taskAId] = await knex('tasks').insert({
    title: 'Validar login con usuario activo',
    description: 'Se verifica autenticacion con credenciales validas.',
    input_variables_json: JSON.stringify({ username: 'demo', password: '***' }),
    repro_steps: '1. Abrir login. 2. Ingresar credenciales validas. 3. Enviar formulario.',
    expected_result: 'El usuario accede al dashboard sin errores.',
    status: 'finished',
    assigned_agent: null,
    created_at: knex.fn.now(),
    updated_at: knex.fn.now()
  });

  const [taskBId] = await knex('tasks').insert({
    title: 'Comprar producto con tarjeta rechazada',
    description: 'Cobro con tarjeta invalida debe retornar mensaje de rechazo.',
    input_variables_json: JSON.stringify({ card: '4000000000000002', amount: 15000 }),
    repro_steps: '1. Agregar producto. 2. Ir a checkout. 3. Ingresar tarjeta rechazada.',
    expected_result: 'Se muestra error de pago y no se genera orden.',
    status: 'executing',
    assigned_agent: 'agent-alpha',
    created_at: knex.fn.now(),
    updated_at: knex.fn.now()
  });

  await knex('task_runs').insert([
    {
      task_id: taskAId,
      run_group_id: runGroupId,
      result: 'ok',
      failure_cause: null,
      agent_name: 'agent-alpha',
      input_snapshot_json: JSON.stringify({ username: 'demo' }),
      expected_snapshot: 'Login exitoso',
      started_at: knex.fn.now(),
      finished_at: knex.fn.now(),
      created_at: knex.fn.now()
    },
    {
      task_id: taskBId,
      run_group_id: runGroupId,
      result: 'fail',
      failure_cause: 'payment_gateway_timeout',
      agent_name: 'agent-beta',
      input_snapshot_json: JSON.stringify({ card: '4000000000000002' }),
      expected_snapshot: 'Mensaje de rechazo controlado',
      started_at: knex.fn.now(),
      finished_at: knex.fn.now(),
      created_at: knex.fn.now()
    },
    {
      task_id: taskBId,
      run_group_id: runGroupId,
      result: 'fail',
      failure_cause: 'payment_gateway_timeout',
      agent_name: 'agent-gamma',
      input_snapshot_json: JSON.stringify({ card: '4000000000000002' }),
      expected_snapshot: 'Mensaje de rechazo controlado',
      started_at: knex.fn.now(),
      finished_at: knex.fn.now(),
      created_at: knex.fn.now()
    }
  ]);
};
