#!/usr/bin/python3
'''

'''
from app.persistence.repository import InMemoryRepository


class HBnBFacade:
    '''
    
    '''
    def __init__(self):
        self.user_repo = InMemoryRepository()
        self.user_repo = InMemoryRepository()
        self.review_repo = InMemoryRepository()
        self.amenity_repo = InMemoryRepository()

    def creat_user(self, user_data):
        pass

    def get_place(self, place_id):
        pass