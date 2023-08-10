#' This script will generate the simulated data

{ # Setup -------------------------------------------------------------------
  
  { # Dependencies ---------------------------------------------------------------
    library(tidyverse)
    library(geojsonio)  
    library(jsonlite)
  }
}


{ # Original Line Data ---------------------------------------------------------------
  
  df_line_raw = read_csv("../src/data/data_line.csv")
  
  df_line_raw %>% 
    pivot_wider(names_from = group, values_from = value) %>% 
    write.csv("../src/data/data_line_wide.csv")
}







  { # Longitudinal --------------------------------------------------------
    
    { # Simulate data -----------------------------------------------------------
      
      df_us = read.csv("raw/NCHS_-_Death_rates_and_life_expectancy_at_birth.csv") %>% as_tibble() %>% 
        janitor::clean_names() %>% 
        filter(race == "All Races", sex == 'Both Sexes',
               year > 1980) %>% 
        select(year, 
               le = average_life_expectancy_years) %>% 
        mutate(group = 'US')
      
      df_dummy_cities = c("Chicago",'Boston') %>% 
        map_df(function(city_tmp){
          df_us %>% 
            mutate(group = city_tmp,
                   le = le + rnorm(n(), mean = rnorm(1, mean = 0, sd = 0.1), sd = 0.1))
        })
      df_dummy_cities %>% 
        ggplot(aes(x =year, y = le, group = group, color = group))+
        geom_line() 
      
      
      df_philly =  read.csv("raw/le_gpt_philly.csv") %>% as_tibble() %>% 
        mutate(group = "Philadelphia")
      
      df_data = list(df_philly, df_us, df_dummy_cities) %>% bind_rows()
      
      
      df_data %>% 
        ggplot(aes(x =year, y = le, group = group, color = group))+
        geom_line() 
      
    }
    
    { # Tidy + export -----------------------------------------------------------

      df_le = df_data %>% 
        rename(value = 'le') %>%
        mutate(group = group %>% recode(
          'Boston' = 'apples',
          'Chicago' = 'dates',
          'US' = 'cherries',
          'Philadelphia' = 'flowers' )) %>% 
        arrange(group,year, value)
      df_le_wide = df_le %>% 
        pivot_wider(names_from = group, values_from = value)
      df_le %>% write.csv("../public/data/data_le.csv", row.names = F)
      df_le_wide %>% write.csv("../public/data/data_le_wide.csv", row.names = F)
      
    }
    
    
  }
