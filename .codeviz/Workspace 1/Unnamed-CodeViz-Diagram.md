# Unnamed CodeViz Diagram

```mermaid
graph TD

    cashier["Cashier<br>/src/components/cashier"]
    client["Client<br>/src/components/client"]
    cook["Cook<br>/src/components/cook"]
    delivery_driver["Delivery Driver<br>/src/components/delivery"]
    administrator["Administrator<br>/src/components/dashboard"]
    mapping_service["Mapping Service<br>/src/features/map"]
    subgraph sushikoi_delivery_system["Sushikoi Delivery System<br>[External]"]
        subgraph web_app["Sushikoi Web Application<br>[External]"]
            cashier_ui["Cashier UI<br>/src/components/cashier"]
            client_ui["Client UI<br>/src/components/client"]
            cook_ui["Cook UI<br>/src/components/cook"]
            dashboard_ui["Dashboard UI<br>/src/components/dashboard"]
            delivery_ui["Delivery UI<br>/src/components/delivery"]
            layout_components["Layout Components<br>/src/components/layout"]
            customer_feature["Customer Feature<br>/src/features/customers"]
            geocoding_feature["Geocoding Feature<br>/src/features/geocoding"]
            map_feature["Map Feature<br>/src/features/map"]
            order_feature["Order Feature<br>/src/features/orders"]
            %% Edges at this level (grouped by source)
            cashier_ui["Cashier UI<br>/src/components/cashier"] -->|"Uses"| customer_feature["Customer Feature<br>/src/features/customers"]
            cashier_ui["Cashier UI<br>/src/components/cashier"] -->|"Uses"| order_feature["Order Feature<br>/src/features/orders"]
            client_ui["Client UI<br>/src/components/client"] -->|"Uses"| order_feature["Order Feature<br>/src/features/orders"]
            cook_ui["Cook UI<br>/src/components/cook"] -->|"Uses"| order_feature["Order Feature<br>/src/features/orders"]
            delivery_ui["Delivery UI<br>/src/components/delivery"] -->|"Uses"| order_feature["Order Feature<br>/src/features/orders"]
            delivery_ui["Delivery UI<br>/src/components/delivery"] -->|"Uses"| geocoding_feature["Geocoding Feature<br>/src/features/geocoding"]
            delivery_ui["Delivery UI<br>/src/components/delivery"] -->|"Uses"| map_feature["Map Feature<br>/src/features/map"]
            dashboard_ui["Dashboard UI<br>/src/components/dashboard"] -->|"Uses"| customer_feature["Customer Feature<br>/src/features/customers"]
            dashboard_ui["Dashboard UI<br>/src/components/dashboard"] -->|"Uses"| order_feature["Order Feature<br>/src/features/orders"]
        end
        subgraph api["Sushikoi API<br>[External]"]
            order_service["Order Service<br>[External]"]
            customer_service["Customer Service<br>[External]"]
            delivery_service["Delivery Service<br>[External]"]
            auth_service["Authentication Service<br>[External]"]
            %% Edges at this level (grouped by source)
            api["Sushikoi API<br>[External]"] -->|"Exposes"| order_service["Order Service<br>[External]"]
            api["Sushikoi API<br>[External]"] -->|"Exposes"| customer_service["Customer Service<br>[External]"]
            api["Sushikoi API<br>[External]"] -->|"Exposes"| delivery_service["Delivery Service<br>[External]"]
            api["Sushikoi API<br>[External]"] -->|"Exposes"| auth_service["Authentication Service<br>[External]"]
        end
        subgraph database["Sushikoi Database<br>[External]"]
            order_repo["Order Repository<br>[External]"]
            customer_repo["Customer Repository<br>[External]"]
            delivery_repo["Delivery Repository<br>[External]"]
        end
        %% Edges at this level (grouped by source)
        web_app["Sushikoi Web Application<br>[External]"] -->|"Makes API calls to | JSON/HTTPS"| api["Sushikoi API<br>[External]"]
        order_service["Order Service<br>[External]"] -->|"Uses"| order_repo["Order Repository<br>[External]"]
        customer_service["Customer Service<br>[External]"] -->|"Uses"| customer_repo["Customer Repository<br>[External]"]
        delivery_service["Delivery Service<br>[External]"] -->|"Uses"| delivery_repo["Delivery Repository<br>[External]"]
    end
    %% Edges at this level (grouped by source)
    cashier["Cashier<br>/src/components/cashier"] -->|"Interacts with"| cashier_ui["Cashier UI<br>/src/components/cashier"]
    cashier["Cashier<br>/src/components/cashier"] -->|"Uses | HTTPS"| web_app["Sushikoi Web Application<br>[External]"]
    client["Client<br>/src/components/client"] -->|"Interacts with"| client_ui["Client UI<br>/src/components/client"]
    client["Client<br>/src/components/client"] -->|"Uses | HTTPS"| web_app["Sushikoi Web Application<br>[External]"]
    cook["Cook<br>/src/components/cook"] -->|"Interacts with"| cook_ui["Cook UI<br>/src/components/cook"]
    cook["Cook<br>/src/components/cook"] -->|"Uses | HTTPS"| web_app["Sushikoi Web Application<br>[External]"]
    delivery_driver["Delivery Driver<br>/src/components/delivery"] -->|"Interacts with"| delivery_ui["Delivery UI<br>/src/components/delivery"]
    delivery_driver["Delivery Driver<br>/src/components/delivery"] -->|"Uses | HTTPS"| web_app["Sushikoi Web Application<br>[External]"]
    administrator["Administrator<br>/src/components/dashboard"] -->|"Interacts with"| dashboard_ui["Dashboard UI<br>/src/components/dashboard"]
    administrator["Administrator<br>/src/components/dashboard"] -->|"Uses | HTTPS"| web_app["Sushikoi Web Application<br>[External]"]
    api["Sushikoi API<br>[External]"] -->|"Uses for location and routing"| mapping_service["Mapping Service<br>/src/features/map"]

```
---
*Generated by [CodeViz.ai](https://codeviz.ai) on 9/13/2025, 5:41:30 PM*
