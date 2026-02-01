ALTER TABLE `marketplaceOrders` ADD `trackingNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `marketplaceOrders` ADD `estimatedDeliveryDate` date;--> statement-breakpoint
ALTER TABLE `marketplaceOrders` ADD `deliveryZoneId` int;--> statement-breakpoint
ALTER TABLE `marketplaceOrders` ADD `shippingCost` decimal(10,2);