
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select event_id
from read_csv_auto('../data/raw_web_events.csv')
where event_id is null



  
  
      
    ) dbt_internal_test