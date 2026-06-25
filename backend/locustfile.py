from locust import HttpUser, task, between

class AncientChineseTaggerUser(HttpUser):
    # 设置目标服务器地址
    host = "http://localhost:8000"
    
    # 设置请求之间的等待时间，模拟真实用户的思考时间（1到3秒之间）
    wait_time = between(1, 3)

    @task(3)
    def check_health(self):
        """测试健康检查接口"""
        self.client.get("/health", name="Health Check")

    @task(2)
    def check_metrics(self):
        """测试指标接口"""
        self.client.get("/metrics", name="Metrics")

    @task(1)
    def get_projects(self):
        """测试获取项目列表接口（假设未登录时返回401或空列表，主要测试接口响应性能）"""
        # 这里我们只测试接口的响应时间，即使返回401也是一种响应
        with self.client.get("/api/projects", name="Get Projects", catch_response=True) as response:
            if response.status_code in [200, 401]:
                response.success()
            else:
                response.failure(f"Unexpected status code: {response.status_code}")

    def on_start(self):
        """在每个虚拟用户启动时执行"""
        pass
