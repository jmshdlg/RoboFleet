;; RoboFleet Robot Registry Contract
;; Clarity v2 (latest syntax as of 2025)
;; Manages registration, ownership, status, and capabilities of autonomous delivery robots
;; Robots are treated as unique entities (like NFTs) with verifiable identities
;; Includes admin controls, pausing, events via prints, and advanced queries

(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-ROBOT-NOT-FOUND u101)
(define-constant ERR-ROBOT-ALREADY-EXISTS u102)
(define-constant ERR-INVALID-ID u103)
(define-constant ERR-PAUSED u104)
(define-constant ERR-ZERO-ADDRESS u105)
(define-constant ERR-INVALID-CAPACITY u106)
(define-constant ERR-NOT-OWNER u107)
(define-constant ERR-INACTIVE-ROBOT u108)
(define-constant ERR-INVALID-STATUS u109)
(define-constant ERR-INVALID-SENSOR-TYPE u110)

;; Contract metadata
(define-constant CONTRACT-NAME "RoboFleet Robot Registry")
(define-constant VERSION "1.0.0")

;; Admin and contract state
(define-data-var admin principal tx-sender)
(define-data-var paused bool false)
(define-data-var next-robot-id uint u1) ;; Starts from 1
(define-data-var robot-count uint u0) ;; Tracks total robots

;; Robot data structures
(define-map robot-owners uint principal) ;; Robot ID to owner principal
(define-map robot-statuses uint bool) ;; Active (true) or inactive (false)
(define-map robot-capabilities uint {
  battery-life: uint,      ;; in minutes
  payload-capacity: uint,  ;; in grams
  speed: uint,             ;; in km/h * 100 for precision
  sensor-type: (string-ascii 32)  ;; e.g., "LIDAR+GPS"
})
(define-map all-robots uint uint) ;; Index to robot-id for querying
(define-map approvals { robot-id: uint, operator: principal } bool) ;; Approved operators

;; Private helper: is-admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

;; Private helper: ensure not paused
(define-private (ensure-not-paused)
  (asserts! (not (var-get paused)) (err ERR-PAUSED))
)

;; Private helper: is-owner
(define-private (is-owner (robot-id uint))
  (is-eq tx-sender (default-to 'SP000000000000000000002Q6VF78 (map-get? robot-owners robot-id)))
)

;; Private helper: validate sensor type
(define-private (validate-sensor-type (sensor (string-ascii 32)))
  (and (> (len sensor) u0) (<= (len sensor) u32))
)

;; Emit event via print
(define-private (emit-event (event-type (string-ascii 32)) (data (tuple (robot-id uint) (owner principal) (status (optional bool)) (capabilities (optional {battery-life: uint, payload-capacity: uint, speed: uint, sensor-type: (string-ascii 32)})))))
  (print { event: event-type, data: data })
)

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (not (is-eq new-admin 'SP000000000000000000002Q6VF78)) (err ERR-ZERO-ADDRESS))
    (var-set admin new-admin)
    (ok true)
  )
)

;; Pause/unpause the contract
(define-public (set-paused (pause bool))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (var-set paused pause)
    (ok pause)
  )
)

;; Register a new robot
(define-public (register-robot (battery-life uint) (payload-capacity uint) (speed uint) (sensor-type (string-ascii 32)))
  (begin
    (ensure-not-paused)
    (asserts! (> battery-life u0) (err ERR-INVALID-CAPACITY))
    (asserts! (> payload-capacity u0) (err ERR-INVALID-CAPACITY))
    (asserts! (> speed u0) (err ERR-INVALID-CAPACITY))
    (asserts! (validate-sensor-type sensor-type) (err ERR-INVALID-SENSOR-TYPE))
    (let ((robot-id (var-get next-robot-id)))
      (asserts! (is-none (map-get? robot-owners robot-id)) (err ERR-ROBOT-ALREADY-EXISTS))
      (map-set robot-owners robot-id tx-sender)
      (map-set robot-statuses robot-id true)
      (map-set robot-capabilities robot-id {
        battery-life: battery-life,
        payload-capacity: payload-capacity,
        speed: speed,
        sensor-type: sensor-type
      })
      (map-set all-robots (var-get robot-count) robot-id)
      (var-set robot-count (+ (var-get robot-count) u1))
      (emit-event "robot-registered" {
        robot-id: robot-id,
        owner: tx-sender,
        status: none,
        capabilities: none
      })
      (var-set next-robot-id (+ robot-id u1))
      (ok robot-id)
    )
  )
)

;; Update robot status
(define-public (update-status (robot-id uint) (active bool))
  (begin
    (ensure-not-paused)
    (asserts! (is-some (map-get? robot-owners robot-id)) (err ERR-ROBOT-NOT-FOUND))
    (asserts! (is-owner robot-id) (err ERR-NOT-OWNER))
    (map-set robot-statuses robot-id active)
    (emit-event "status-updated" {
      robot-id: robot-id,
      owner: tx-sender,
      status: (some active),
      capabilities: none
    })
    (ok true)
  )
)

;; Update robot capabilities
(define-public (update-capabilities (robot-id uint) (battery-life uint) (payload-capacity uint) (speed uint) (sensor-type (string-ascii 32)))
  (begin
    (ensure-not-paused)
    (asserts! (is-some (map-get? robot-owners robot-id)) (err ERR-ROBOT-NOT-FOUND))
    (asserts! (is-owner robot-id) (err ERR-NOT-OWNER))
    (asserts! (> battery-life u0) (err ERR-INVALID-CAPACITY))
    (asserts! (> payload-capacity u0) (err ERR-INVALID-CAPACITY))
    (asserts! (> speed u0) (err ERR-INVALID-CAPACITY))
    (asserts! (validate-sensor-type sensor-type) (err ERR-INVALID-SENSOR-TYPE))
    (map-set robot-capabilities robot-id {
      battery-life: battery-life,
      payload-capacity: payload-capacity,
      speed: speed,
      sensor-type: sensor-type
    })
    (emit-event "capabilities-updated" {
      robot-id: robot-id,
      owner: tx-sender,
      status: none,
      capabilities: (some { battery-life: battery-life, payload-capacity: payload-capacity, speed: speed, sensor-type: sensor-type })
    })
    (ok true)
  )
)

;; Approve an operator for a robot
(define-public (approve (robot-id uint) (operator principal))
  (begin
    (ensure-not-paused)
    (asserts! (is-some (map-get? robot-owners robot-id)) (err ERR-ROBOT-NOT-FOUND))
    (asserts! (is-owner robot-id) (err ERR-NOT-OWNER))
    (asserts! (not (is-eq operator 'SP000000000000000000002Q6VF78)) (err ERR-ZERO-ADDRESS))
    (map-set approvals { robot-id: robot-id, operator: operator } true)
    (ok true)
  )
)

;; Revoke approval
(define-public (revoke-approval (robot-id uint) (operator principal))
  (begin
    (ensure-not-paused)
    (asserts! (is-some (map-get? robot-owners robot-id)) (err ERR-ROBOT-NOT-FOUND))
    (asserts! (is-owner robot-id) (err ERR-NOT-OWNER))
    (asserts! (not (is-eq operator 'SP000000000000000000002Q6VF78)) (err ERR-ZERO-ADDRESS))
    (map-delete approvals { robot-id: robot-id, operator: operator })
    (ok true)
  )
)

;; Transfer ownership of a robot
(define-public (transfer-ownership (robot-id uint) (new-owner principal))
  (begin
    (ensure-not-paused)
    (asserts! (is-some (map-get? robot-owners robot-id)) (err ERR-ROBOT-NOT-FOUND))
    (asserts! (not (is-eq new-owner 'SP000000000000000000002Q6VF78)) (err ERR-ZERO-ADDRESS))
    (let ((current-owner (unwrap! (map-get? robot-owners robot-id) (err ERR-ROBOT-NOT-FOUND)))
          (is-approved (default-to false (map-get? approvals { robot-id: robot-id, operator: tx-sender }))))
      (asserts! (or (is-eq tx-sender current-owner) is-approved) (err ERR-NOT-AUTHORIZED))
      (map-set robot-owners robot-id new-owner)
      (map-delete approvals { robot-id: robot-id, operator: tx-sender })
      (emit-event "ownership-transferred" {
        robot-id: robot-id,
        owner: new-owner,
        status: none,
        capabilities: none
      })
      (ok true)
    )
  )
)

;; Read-only: Get owner of robot
(define-read-only (get-owner (robot-id uint))
  (ok (map-get? robot-owners robot-id))
)

;; Read-only: Get status of robot
(define-read-only (get-status (robot-id uint))
  (ok (default-to false (map-get? robot-statuses robot-id)))
)

;; Read-only: Get capabilities of robot
(define-read-only (get-capabilities (robot-id uint))
  (ok (map-get? robot-capabilities robot-id))
)

;; Read-only: Check if operator is approved for robot
(define-read-only (is-approved (robot-id uint) (operator principal))
  (ok (default-to false (map-get? approvals { robot-id: robot-id, operator: operator })))
)

;; Read-only: Get next robot ID
(define-read-only (get-next-id)
  (ok (var-get next-robot-id))
)

;; Read-only: Get admin
(define-read-only (get-admin)
  (ok (var-get admin))
)

;; Read-only: Is paused
(define-read-only (is-paused)
  (ok (var-get paused))
)

;; Read-only: Get total robot count
(define-read-only (get-robot-count)
  (ok (var-get robot-count))
)

;; Read-only: Get robot ID by index
(define-read-only (get-robot-by-index (index uint))
  (ok (map-get? all-robots index))
)

;; Advanced query: Find robots by minimum payload capacity
(define-read-only (find-robots-by-capacity (min-capacity uint))
  (let ((count (var-get robot-count)))
    (fold filter-robots-by-capacity
         (list u0 u1 u2 u3 u4 u5 u6 u7 u8 u9 u10 u11 u12 u13 u14 u15 u16 u17 u18 u19)
         (list)
    )
  )
)

;; Private helper: Filter robots by capacity
(define-private (filter-robots-by-capacity (index uint) (result (list 20 uint)))
  (let ((robot-id (default-to u0 (map-get? all-robots index))))
    (if (and (> robot-id u0)
             (let ((caps (default-to { battery-life: u0, payload-capacity: u0, speed: u0, sensor-type: "" }
                                     (map-get? robot-capabilities robot-id))))
               (>= (get payload-capacity caps) min-capacity)))
        (append result robot-id)
        result
    )
  )
)