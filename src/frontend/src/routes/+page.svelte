<script>
  import "../index.scss";
  import { backend } from "$lib/canisters";

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
  <form action="#" on:submit|preventDefault={onSubmit}>
    <button type="submit">Click Me!</button>
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
        <div>
          <strong>Tables:</strong>
          <ul>
            {#each database_info.Ok.tables as table}
              <li>
                <strong>{table.table_name}</strong> ({table.row_count} rows, {table.column_count} columns)
                <ul>
                  {#each table.schema as col}
                    <li>{JSON.stringify(col)}</li>
                  {/each}
                </ul>
              </li>
            {/each}
          </ul>
        </div>
      {:else}
        <pre>{JSON.stringify(database_info, null, 2)}</pre>
      {/if}
    {/if}
  </section>
</main>
