#!/usr/bin/env python3
"""
Script de teste completo do sistema Trello Nexma
Testa autenticação, CRUD, convites, notificações, clientes
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:3000"
API_URL = f"{BASE_URL}/api"

# Cores para terminal
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

class SystemTester:
    def __init__(self):
        self.user1_session = requests.Session()
        self.user2_session = requests.Session()
        self.user1_email = f"admin_{int(time.time())}@test.com"
        self.user2_email = f"member_{int(time.time())}@test.com"
        self.user1_password = "Admin123!@#"
        self.user2_password = "Member123!@#"
        self.board_id = None
        self.column1_id = None
        self.column2_id = None
        self.column3_id = None
        self.client_id = None
        self.card_id = None
        self.checklist_id = None
        self.user2_id = None
        self.tests_passed = 0
        self.tests_failed = 0

    def log_test(self, name, success, response=None):
        """Log resultado do teste"""
        if success:
            print(f"{GREEN}✓{RESET} {name}")
            self.tests_passed += 1
        else:
            print(f"{RED}✗{RESET} {name}")
            self.tests_failed += 1

        if response:
            try:
                print(f"  {BLUE}Response:{RESET} {json.dumps(response, indent=2)[:200]}")
            except:
                print(f"  {BLUE}Response:{RESET} {str(response)[:200]}")

    def test_auth(self):
        """Teste de autenticação"""
        print(f"\n{YELLOW}{'='*60}{RESET}")
        print(f"{YELLOW}1. TESTE DE AUTENTICAÇÃO{RESET}")
        print(f"{YELLOW}{'='*60}{RESET}\n")

        # 1.1 Registro User1
        print("1.1 Registrando User1 (Admin)")
        response = self.user1_session.post(f"{API_URL}/auth/register", json={
            "name": "Admin Teste",
            "email": self.user1_email,
            "password": self.user1_password
        })
        self.log_test("Registro User1", response.status_code in [200, 201])

        # 1.2 Login User1
        print("\n1.2 Login User1")
        response = self.user1_session.post(f"{API_URL}/auth/login", json={
            "email": self.user1_email,
            "password": self.user1_password
        })
        self.log_test("Login User1", response.status_code == 200)

        # 1.3 Registro User2
        print("\n1.3 Registrando User2 (Membro)")
        response = self.user2_session.post(f"{API_URL}/auth/register", json={
            "name": "Membro Teste",
            "email": self.user2_email,
            "password": self.user2_password
        })
        self.log_test("Registro User2", response.status_code in [200, 201])

        # 1.4 Login User2
        print("\n1.4 Login User2")
        response = self.user2_session.post(f"{API_URL}/auth/login", json={
            "email": self.user2_email,
            "password": self.user2_password
        })
        self.log_test("Login User2", response.status_code == 200)

        # Pegar ID do User2
        response = self.user2_session.get(f"{API_URL}/auth/me")
        if response.status_code == 200:
            self.user2_id = response.json().get('id')
            print(f"  {BLUE}User2 ID:{RESET} {self.user2_id}")

    def test_boards(self):
        """Teste de Boards"""
        print(f"\n{YELLOW}{'='*60}{RESET}")
        print(f"{YELLOW}2. TESTE DE BOARDS{RESET}")
        print(f"{YELLOW}{'='*60}{RESET}\n")

        # 2.1 Criar Board
        print("2.1 Criando Board")
        response = self.user1_session.post(f"{API_URL}/boards", json={
            "title": "Board de Teste",
            "isOrgWide": False
        })
        success = response.status_code in [200, 201]
        if success:
            self.board_id = response.json().get('id')
            print(f"  {BLUE}Board ID:{RESET} {self.board_id}")
        self.log_test("Criar Board", success, response.json() if success else None)

        # 2.2 Listar Boards
        print("\n2.2 Listando Boards")
        response = self.user1_session.get(f"{API_URL}/boards")
        self.log_test("Listar Boards", response.status_code == 200)

    def test_columns(self):
        """Teste de Colunas"""
        print(f"\n{YELLOW}{'='*60}{RESET}")
        print(f"{YELLOW}3. TESTE DE COLUNAS{RESET}")
        print(f"{YELLOW}{'='*60}{RESET}\n")

        if not self.board_id:
            print(f"{RED}Pulando - Board ID não disponível{RESET}")
            return

        # 3.1 Criar Coluna 1
        print("3.1 Criando Coluna 'Novos Leads'")
        response = self.user1_session.post(f"{API_URL}/boards/{self.board_id}/columns", json={
            "title": "Novos Leads"
        })
        success = response.status_code in [200, 201]
        if success:
            self.column1_id = response.json().get('id')
            print(f"  {BLUE}Coluna 1 ID:{RESET} {self.column1_id}")
        self.log_test("Criar Coluna 1", success)

        # 3.2 Criar Coluna 2
        print("\n3.2 Criando Coluna 'Em Atendimento'")
        response = self.user1_session.post(f"{API_URL}/boards/{self.board_id}/columns", json={
            "title": "Em Atendimento"
        })
        success = response.status_code in [200, 201]
        if success:
            self.column2_id = response.json().get('id')
            print(f"  {BLUE}Coluna 2 ID:{RESET} {self.column2_id}")
        self.log_test("Criar Coluna 2", success)

        # 3.3 Criar Coluna 3
        print("\n3.3 Criando Coluna 'Finalizado'")
        response = self.user1_session.post(f"{API_URL}/boards/{self.board_id}/columns", json={
            "title": "Finalizado"
        })
        success = response.status_code in [200, 201]
        if success:
            self.column3_id = response.json().get('id')
            print(f"  {BLUE}Coluna 3 ID:{RESET} {self.column3_id}")
        self.log_test("Criar Coluna 3", success)

    def test_clients(self):
        """Teste de Clientes"""
        print(f"\n{YELLOW}{'='*60}{RESET}")
        print(f"{YELLOW}4. TESTE DE CLIENTES{RESET}")
        print(f"{YELLOW}{'='*60}{RESET}\n")

        # 4.1 Criar Cliente
        print("4.1 Criando Cliente 'Empresa XYZ Ltda'")
        response = self.user1_session.post(f"{API_URL}/clients", json={
            "name": "Empresa XYZ Ltda",
            "status": "URGENTE",
            "lead": 1001
        })
        success = response.status_code in [200, 201]
        if success:
            self.client_id = response.json().get('id')
            print(f"  {BLUE}Cliente ID:{RESET} {self.client_id}")
        self.log_test("Criar Cliente", success, response.json() if success else None)

        # 4.2 Listar Clientes
        print("\n4.2 Listando Clientes")
        response = self.user1_session.get(f"{API_URL}/clients")
        self.log_test("Listar Clientes", response.status_code == 200)

        # 4.3 Atualizar Cliente
        if self.client_id:
            print("\n4.3 Atualizando Cliente (status -> EMERGENCIA)")
            response = self.user1_session.put(f"{API_URL}/clients/{self.client_id}", json={
                "status": "EMERGENCIA",
                "lead": 1002
            })
            self.log_test("Atualizar Cliente", response.status_code == 200)

    def test_cards_with_client(self):
        """Teste de Cards com Cliente"""
        print(f"\n{YELLOW}{'='*60}{RESET}")
        print(f"{YELLOW}5. TESTE DE CARDS COM CLIENTE{RESET}")
        print(f"{YELLOW}{'='*60}{RESET}\n")

        if not self.board_id or not self.column1_id or not self.client_id:
            print(f"{RED}Pulando - IDs necessários não disponíveis{RESET}")
            return

        # 5.1 Criar Card com Cliente
        print("5.1 Criando Card com Cliente vinculado")
        response = self.user1_session.post(f"{API_URL}/boards/{self.board_id}/cards", json={
            "columnId": self.column1_id,
            "title": "Atendimento Empresa XYZ",
            "description": "Suporte técnico urgente",
            "urgency": "HIGH",
            "clientId": self.client_id
        })
        success = response.status_code in [200, 201]
        if success:
            data = response.json()
            self.card_id = data.get('card', {}).get('id') or data.get('id')
            print(f"  {BLUE}Card ID:{RESET} {self.card_id}")
        self.log_test("Criar Card com Cliente", success)

        # 5.2 Verificar Card
        if self.card_id:
            print("\n5.2 Verificando detalhes do Card")
            response = self.user1_session.get(f"{API_URL}/boards/{self.board_id}/cards/{self.card_id}")
            success = response.status_code == 200
            if success:
                card_data = response.json()
                has_client = 'clientId' in card_data or 'client' in card_data
                print(f"  {BLUE}Cliente vinculado:{RESET} {has_client}")
            self.log_test("Verificar Card com Cliente", success and has_client)

        # 5.3 Mover Card
        if self.card_id and self.column2_id:
            print("\n5.3 Movendo Card para 'Em Atendimento'")
            response = self.user1_session.put(f"{API_URL}/boards/{self.board_id}/cards/{self.card_id}", json={
                "columnId": self.column2_id
            })
            self.log_test("Mover Card", response.status_code == 200)

    def test_invites(self):
        """Teste de Convites"""
        print(f"\n{YELLOW}{'='*60}{RESET}")
        print(f"{YELLOW}6. TESTE DE CONVITES{RESET}")
        print(f"{YELLOW}{'='*60}{RESET}\n")

        if not self.board_id:
            print(f"{RED}Pulando - Board ID não disponível{RESET}")
            return

        # 6.1 Convidar User2
        print("6.1 Convidando User2 para o Board")
        response = self.user1_session.post(f"{API_URL}/boards/{self.board_id}/members", json={
            "email": self.user2_email,
            "role": "MEMBER"
        })
        self.log_test("Convidar Membro", response.status_code in [200, 201])

        # 6.2 Verificar notificações User2
        print("\n6.2 Verificando notificações do User2")
        time.sleep(1)  # Aguardar processamento
        response = self.user2_session.get(f"{API_URL}/notifications")
        self.log_test("Verificar Notificações", response.status_code == 200)

    def test_assignees(self):
        """Teste de Atribuição de Pessoas"""
        print(f"\n{YELLOW}{'='*60}{RESET}")
        print(f"{YELLOW}7. TESTE DE ASSIGNEES{RESET}")
        print(f"{YELLOW}{'='*60}{RESET}\n")

        if not self.card_id or not self.user2_id:
            print(f"{RED}Pulando - Card ID ou User2 ID não disponível{RESET}")
            return

        # 7.1 Atribuir User2 ao Card
        print("7.1 Atribuindo User2 ao Card")
        response = self.user1_session.post(
            f"{API_URL}/boards/{self.board_id}/cards/{self.card_id}/assignees",
            json={"userId": self.user2_id}
        )
        self.log_test("Atribuir Pessoa ao Card", response.status_code in [200, 201])

        # 7.2 Verificar Card com assignee
        print("\n7.2 Verificando Card com assignee")
        response = self.user1_session.get(f"{API_URL}/boards/{self.board_id}/cards/{self.card_id}")
        success = response.status_code == 200
        if success:
            card_data = response.json()
            has_assignees = 'assignees' in card_data and len(card_data.get('assignees', [])) > 0
            print(f"  {BLUE}Assignees encontrados:{RESET} {has_assignees}")
        self.log_test("Verificar Assignees", success and has_assignees)

    def test_checklists(self):
        """Teste de Checklists"""
        print(f"\n{YELLOW}{'='*60}{RESET}")
        print(f"{YELLOW}8. TESTE DE CHECKLISTS{RESET}")
        print(f"{YELLOW}{'='*60}{RESET}\n")

        if not self.card_id:
            print(f"{RED}Pulando - Card ID não disponível{RESET}")
            return

        # 8.1 Criar Checklist
        print("8.1 Criando Checklist no Card")
        response = self.user1_session.post(
            f"{API_URL}/boards/{self.board_id}/cards/{self.card_id}/checklists",
            json={"title": "Tarefas de Atendimento"}
        )
        success = response.status_code in [200, 201]
        if success:
            self.checklist_id = response.json().get('id')
            print(f"  {BLUE}Checklist ID:{RESET} {self.checklist_id}")
        self.log_test("Criar Checklist", success)

        # 8.2 Adicionar Item 1
        if self.checklist_id:
            print("\n8.2 Adicionando Item 1 à Checklist")
            response = self.user1_session.post(
                f"{API_URL}/checklists/{self.checklist_id}/items",
                json={"content": "Analisar problema relatado"}
            )
            success = response.status_code in [200, 201]
            item1_id = None
            if success:
                item1_id = response.json().get('id')
                print(f"  {BLUE}Item 1 ID:{RESET} {item1_id}")
            self.log_test("Adicionar Item 1", success)

            # 8.3 Adicionar Item 2
            print("\n8.3 Adicionando Item 2 à Checklist")
            response = self.user1_session.post(
                f"{API_URL}/checklists/{self.checklist_id}/items",
                json={"content": "Propor solução"}
            )
            self.log_test("Adicionar Item 2", response.status_code in [200, 201])

            # 8.4 Marcar Item 1 como concluído
            if item1_id:
                print("\n8.4 Marcando Item 1 como concluído")
                response = self.user1_session.patch(f"{API_URL}/checklist-items/{item1_id}/toggle")
                self.log_test("Toggle Item", response.status_code == 200)

    def test_client_details(self):
        """Teste de Detalhes do Cliente"""
        print(f"\n{YELLOW}{'='*60}{RESET}")
        print(f"{YELLOW}9. TESTE DE DETALHES DO CLIENTE{RESET}")
        print(f"{YELLOW}{'='*60}{RESET}\n")

        if not self.client_id:
            print(f"{RED}Pulando - Cliente ID não disponível{RESET}")
            return

        # 9.1 Buscar detalhes do cliente
        print("9.1 Buscando detalhes completos do Cliente")
        response = self.user1_session.get(f"{API_URL}/clients/{self.client_id}")
        success = response.status_code == 200
        if success:
            client_data = response.json()
            has_cards = 'cards' in client_data
            print(f"  {BLUE}Cards vinculados:{RESET} {len(client_data.get('cards', []))}")
        self.log_test("Detalhes do Cliente", success and has_cards)

    def test_comments(self):
        """Teste de Comentários"""
        print(f"\n{YELLOW}{'='*60}{RESET}")
        print(f"{YELLOW}10. TESTE DE COMENTÁRIOS{RESET}")
        print(f"{YELLOW}{'='*60}{RESET}\n")

        if not self.card_id:
            print(f"{RED}Pulando - Card ID não disponível{RESET}")
            return

        # 10.1 User1 adiciona comentário
        print("10.1 User1 adicionando comentário")
        response = self.user1_session.post(
            f"{API_URL}/boards/{self.board_id}/cards/{self.card_id}/comments",
            json={"content": "Cliente necessita atenção urgente!"}
        )
        self.log_test("Adicionar Comentário User1", response.status_code in [200, 201])

        # 10.2 User2 adiciona comentário
        print("\n10.2 User2 adicionando comentário")
        response = self.user2_session.post(
            f"{API_URL}/boards/{self.board_id}/cards/{self.card_id}/comments",
            json={"content": "Iniciando atendimento agora"}
        )
        self.log_test("Adicionar Comentário User2", response.status_code in [200, 201])

    def run_all_tests(self):
        """Executar todos os testes"""
        print(f"\n{BLUE}{'='*60}{RESET}")
        print(f"{BLUE}🧪 TESTE COMPLETO DO SISTEMA TRELLO NEXMA{RESET}")
        print(f"{BLUE}{'='*60}{RESET}")

        self.test_auth()
        self.test_boards()
        self.test_columns()
        self.test_clients()
        self.test_cards_with_client()
        self.test_invites()
        self.test_assignees()
        self.test_checklists()
        self.test_client_details()
        self.test_comments()

        # Resumo
        print(f"\n{YELLOW}{'='*60}{RESET}")
        print(f"{YELLOW}✅ TESTE COMPLETO FINALIZADO{RESET}")
        print(f"{YELLOW}{'='*60}{RESET}\n")

        total = self.tests_passed + self.tests_failed
        print(f"Total de testes: {total}")
        print(f"{GREEN}Testes passaram: {self.tests_passed}{RESET}")
        print(f"{RED}Testes falharam: {self.tests_failed}{RESET}")

        if self.tests_failed == 0:
            print(f"\n{GREEN}🎉 TODOS OS TESTES PASSARAM!{RESET}")
        else:
            print(f"\n{RED}⚠️  Alguns testes falharam{RESET}")

        print(f"\n{BLUE}Resumo dos IDs criados:{RESET}")
        print(f"- User1 Email: {self.user1_email}")
        print(f"- User2 Email: {self.user2_email}")
        print(f"- Board ID: {self.board_id}")
        print(f"- Cliente ID: {self.client_id}")
        print(f"- Card ID: {self.card_id}")
        print(f"\nAcesse o sistema em: {BASE_URL}/login")
        print(f"User1: {self.user1_email} / {self.user1_password}")
        print(f"User2: {self.user2_email} / {self.user2_password}\n")

if __name__ == "__main__":
    tester = SystemTester()
    tester.run_all_tests()
