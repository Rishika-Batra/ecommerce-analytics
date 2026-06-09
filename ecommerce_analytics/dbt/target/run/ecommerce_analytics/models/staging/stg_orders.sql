
  
    
    

    create  table
      "ecommerce"."main"."stg_orders__dbt_tmp"
  
    as (
      with source as (
    select * from read_csv_auto('../data/raw_orders.csv')
)

select
    cast(order_id as varchar) as order_id,
    cast(customer_id as varchar) as customer_id,
    cast(order_date as timestamp) as order_date,
    cast(total_amount as double) as total_amount,
    cast(status as varchar) as status
from source
    );
  
  