# 07. 앱 내장 프롬프트 템플릿

## 1. 아이디어 검토 프롬프트

```text
다음 아이디어를 실행 가능한 MVP 관점에서 검토해줘.

[아이디어]
제목: {{idea.title}}
요약: {{idea.summary}}
문제 정의: {{idea.problem}}
대상 사용자: {{idea.targetUser}}
기대 효과: {{idea.expectedValue}}

[보유 리소스]
{{resources}}

[검토 기준]
1. 문제 명확성
2. 사용자 가치
3. 구현 난이도
4. 리소스 충분도
5. 기술 적합성
6. 확장 가능성
7. 수익/활용 가능성
8. 리스크

각 항목을 1~5점으로 평가하고, 부족한 리소스와 다음 액션을 제안해줘.
```

## 2. 코덱스 구현 프롬프트

```text
아래 기능을 현재 프로젝트에 구현해줘.

[기능]
{{stage.title}}

[목적]
{{stage.goal}}

[입력 자료]
{{stage.inputRequired}}

[산출물]
{{stage.outputExpected}}

[완료 조건]
{{stage.doneCriteria}}

[주의사항]
- 기존 구조를 과도하게 바꾸지 말 것
- TypeScript 타입 오류가 없게 할 것
- 예외 처리와 빈 상태 UI를 포함할 것
- 구현 후 테스트 방법을 알려줄 것
```

## 3. 이슈 발생 시 분기 설계 프롬프트

```text
현재 진행 중 아래 이슈가 발생했다.

[원래 단계]
{{currentStage.title}}

[원래 목표]
{{currentStage.goal}}

[발생 이슈]
{{issue.description}}

[현재 제약]
{{constraints}}

원래 방향을 유지하는 방안과 수정된 진행 방향을 각각 제안해줘.
각 방안의 장단점, 리스크, 다음 작업 순서를 비교해줘.
```

## 4. Markdown Export 프롬프트

```text
아래 아이디어 정보를 코덱스에게 넘길 수 있는 구현 요청서 형태의 Markdown으로 정리해줘.

[아이디어]
{{idea}}

[리소스]
{{resources}}

[검토 결과]
{{review}}

[단계]
{{stages}}

[진행 트리]
{{flow}}
```

## 5. 테스트 케이스 생성 프롬프트

```text
아래 기능의 수동 테스트 케이스와 엣지 케이스를 작성해줘.

[기능]
{{featureName}}

[요구사항]
{{requirements}}

[예외 조건]
{{edgeCases}}

출력 형식:
- 테스트명
- 사전 조건
- 절차
- 기대 결과
- 실패 시 확인할 로그/화면
```
