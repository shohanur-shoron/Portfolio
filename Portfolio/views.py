from django.shortcuts import render

def index(request):
    return render(request, 'index.html')

def viewCV(request):
    return render(request, 'cv.html')