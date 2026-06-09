
  
    
    

    create  table
      "ecommerce"."main"."stg_order_items__dbt_tmp"
  
    as (
      with source as (
    select * from read_csv_auto('../data/raw_order_items.csv')
)

select
    cast(item_id as varchar) as item_id,
    cast(order_id as varchar) as order_id,
    cast(product_id as varchar) as product_id,
    cast(quantity as integer) as quantity,
    cast(price as double) as price
from source
    );
  
  