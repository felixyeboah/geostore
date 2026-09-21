import assert from "node:assert/strict";
import { test } from "node:test";
import { productImageUrl } from "./product-image-url";

test("R2 bucket public URLs do not gain a bucket-name path", () => {
	assert.equal(
		productImageUrl("catalogue/phone photo.jpg", {
			publicBucketUrl: "https://images.example.com/",
			bucketName: "geostore-products",
		}),
		"https://images.example.com/catalogue/phone%20photo.jpg",
	);
});
test("legacy S3 origins use the configured bucket name", () => {
	assert.equal(
		productImageUrl("photo.jpg", {
			publicStorageUrl: "http://localhost:9000/",
			bucketName: "geostore-products",
		}),
		"http://localhost:9000/geostore-products/photo.jpg",
	);
});
test("private R2 API endpoints cannot masquerade as public image origins", () => {
	assert.throws(() =>
		productImageUrl("photo.jpg", {
			endpoint: "https://account.r2.cloudflarestorage.com",
		}),
	);
});
