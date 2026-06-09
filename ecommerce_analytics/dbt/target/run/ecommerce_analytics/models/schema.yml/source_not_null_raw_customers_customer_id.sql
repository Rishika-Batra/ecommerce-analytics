
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select customer_id
from read_csv_auto('../data/raw_customers.csv')
where customer_id is null



  
  
      
    ) dbt_internal_test