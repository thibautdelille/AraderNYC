# Shortcuts for Shopify theme CLI (store from shopify.theme.toml)
STORE ?= arader-galleries-2.myshopify.com

.PHONY: dev pull push push-new check list share open info

dev:
	shopify theme dev --store $(STORE)

pull:
	shopify theme pull --store $(STORE)

push:
	shopify theme push --store $(STORE)

push-new:
	shopify theme push --unpublished --store $(STORE)

check:
	shopify theme check

list:
	shopify theme list --store $(STORE)

share:
	shopify theme share --store $(STORE)

open:
	shopify theme open --store $(STORE)

info:
	shopify theme info --store $(STORE)
