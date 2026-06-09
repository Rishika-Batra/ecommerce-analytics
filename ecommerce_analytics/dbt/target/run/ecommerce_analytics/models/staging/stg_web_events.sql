
  
    
    

    create  table
      "ecommerce"."main"."stg_web_events__dbt_tmp"
  
    as (
      with source as (
    select * from read_csv_auto('../data/raw_web_events.csv')
)

select
    cast(event_id as varchar) as event_id,
    cast(customer_id as varchar) as customer_id,
    cast(session_id as varchar) as session_id,
    cast(event_timestamp as timestamp) as event_timestamp,
    cast(event_type as varchar) as event_type,
    cast(product_id as varchar) as product_id
from source
    );
  
  