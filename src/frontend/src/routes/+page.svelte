<script>
  import { backend } from "$lib/canisters";
  import { Avatar } from '@skeletonlabs/skeleton-svelte';
  import { Progress } from '@skeletonlabs/skeleton-svelte';
  let database_info = null;

  function onSubmit(event) {
    //const name = event.target.name.value;
    backend.get_database_info().then((response) => {
      database_info = response;
      console.log(response);
    });
    return false;
  }
</script>

<main>
  <img src="/logo2.svg" alt="DFINITY logo" />
  <br />
  <h1 class="text-5xl font-bold underline text-center">
    Hello world!
  </h1>
  <!-- <Avatar src="https://i.pravatar.cc/150?img=48" name="skeleton" />
  <Progress value={50} max={100}>50%</Progress> -->
  <form action="#" on:submit|preventDefault={onSubmit}>
    <button type="submit" class="btn preset-filled-primary-500">Load database info</button>
  </form>
  <section>
    {#if database_info}
      {#if database_info.Ok}
        <div>
          <strong>Database Size (MB):</strong> {database_info.Ok.database_size_mb}
        </div>
        <div>
          <strong>Total Tables:</strong> {database_info.Ok.total_tables}
        </div>
        <div class="mt-6">
          <h2 class="text-2xl font-bold mb-4">Database Tables</h2>
          {#each database_info.Ok.tables as table}
            <div class="mb-8">
              <h3 class="text-xl font-semibold mb-2">{table.table_name}</h3>
              <p class="text-sm text-surface-600 mb-4">{table.row_count} rows, {table.column_count} columns</p>
              
              <div class="table-wrap">
                <table class="table caption-bottom">
                  <caption class="caption-top text-left font-semibold mb-2">
                    Table Schema
                  </caption>
                  <thead>
                    <tr>
                      <th>Column Name</th>
                      <th>Data Type</th>
                      <th>Nullable</th>
                      <th>Default Value</th>
                      <th class="text-right">Primary Key</th>
                    </tr>
                  </thead>
                  <tbody class="[&>tr]:hover:preset-tonal-primary">
                    {#each table.schema as col}
                      <tr>
                        <td class="font-medium">{col.name || 'N/A'}</td>
                        <td><span class="badge preset-filled-secondary-500">{col.data_type || 'N/A'}</span></td>
                        <td>
                          {#if !col.not_null}
                            <span class="badge preset-filled-warning-500">Yes</span>
                          {:else}
                            <span class="badge preset-filled-success-500">No</span>
                          {/if}
                        </td>
                        <td>{col.default_value || '-'}</td>
                        <td class="text-right">
                          {#if col.primary_key}
                            <span class="badge preset-filled-primary-500">✓</span>
                          {:else}
                            <span class="text-surface-500">-</span>
                          {/if}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <pre>{JSON.stringify(database_info, null, 2)}</pre>
      {/if}
    {/if}
  </section>
</main>
