/*
 Navicat Premium Dump SQL

 Source Server         : ancient
 Source Server Type    : MySQL
 Source Server Version : 80045 (8.0.45-0ubuntu0.22.04.1)
 Source Host           : 121.196.168.115:3306
 Source Schema         : ancient

 Target Server Type    : MySQL
 Target Server Version : 80045 (8.0.45-0ubuntu0.22.04.1)
 File Encoding         : 65001

 Date: 22/03/2026 15:48:35
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for annotations
-- ----------------------------
DROP TABLE IF EXISTS `annotations`;
CREATE TABLE `annotations`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `document_id` int NOT NULL,
  `entity` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `entity_type` enum('person','location','time','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `start_pos` int NULL DEFAULT NULL,
  `end_pos` int NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `document_id`(`document_id` ASC) USING BTREE,
  CONSTRAINT `annotations_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of annotations
-- ----------------------------
INSERT INTO `annotations` VALUES (1, 1, '项羽', 'person', 0, 2, '2026-03-22 15:27:36', '2026-03-22 15:27:36');
INSERT INTO `annotations` VALUES (2, 1, '楚', 'location', 10, 11, '2026-03-22 15:27:36', '2026-03-22 15:27:36');
INSERT INTO `annotations` VALUES (3, 2, '高祖', 'person', 0, 2, '2026-03-22 15:27:36', '2026-03-22 15:27:36');
INSERT INTO `annotations` VALUES (4, 2, '沛县', 'location', 3, 5, '2026-03-22 15:27:36', '2026-03-22 15:27:36');
INSERT INTO `annotations` VALUES (5, 2, '刘', 'person', 9, 10, '2026-03-22 15:27:36', '2026-03-22 15:27:36');
INSERT INTO `annotations` VALUES (6, 3, '河', 'location', 5, 6, '2026-03-22 15:27:36', '2026-03-22 15:27:36');

-- ----------------------------
-- Table structure for documents
-- ----------------------------
DROP TABLE IF EXISTS `documents`;
CREATE TABLE `documents`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `project_id`(`project_id` ASC) USING BTREE,
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of documents
-- ----------------------------
INSERT INTO `documents` VALUES (1, 1, '史记·项羽本纪', '项羽，名籍，字羽，楚人也。', '2026-03-22 15:27:31', '2026-03-22 15:27:31');
INSERT INTO `documents` VALUES (2, 1, '史记·高祖本纪', '高祖，沛县人，姓刘，字季。', '2026-03-22 15:27:31', '2026-03-22 15:27:31');
INSERT INTO `documents` VALUES (3, 2, '诗经·关雎', '关关雎鸠，在河之洲。', '2026-03-22 15:27:31', '2026-03-22 15:27:31');

-- ----------------------------
-- Table structure for projects
-- ----------------------------
DROP TABLE IF EXISTS `projects`;
CREATE TABLE `projects`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `owner_id` int NOT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `owner_id`(`owner_id` ASC) USING BTREE,
  CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of projects
-- ----------------------------
INSERT INTO `projects` VALUES (1, '古文标注项目A', '用于标注史记文本', 1, '2026-03-22 15:27:25', '2026-03-22 15:27:25');
INSERT INTO `projects` VALUES (2, '古文标注项目B', '用于标注诗经文本', 2, '2026-03-22 15:27:25', '2026-03-22 15:27:25');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'zhangsan', 'hashed_password_1', '2026-03-22 15:27:21', '2026-03-22 15:27:21');
INSERT INTO `users` VALUES (2, 'lisi', 'hashed_password_2', '2026-03-22 15:27:21', '2026-03-22 15:27:21');

SET FOREIGN_KEY_CHECKS = 1;
